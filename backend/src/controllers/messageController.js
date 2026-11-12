import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { sendPushNotificationToUser } from '../routers/pushRoutes.js';
import { handleInChatAiTrigger } from '../routers/aiRoutes.js';

// Fetch all messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // 1. Automatically mark unread messages from other users in this conversation as READ & DELIVERED by currentUser
    const unreadMessages = await Message.find({
      conversationId,
      sender: { $ne: currentUser._id },
      readBy: { $ne: currentUser._id }
    }).select('_id');

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(m => m._id);
      await Message.updateMany(
        { _id: { $in: unreadIds } },
        { $addToSet: { readBy: currentUser._id, deliveredTo: currentUser._id } }
      );

      const io = req.app.get('io');
      if (io) {
        const cIdStr = String(conversationId);
        const stringMsgIds = unreadIds.map(String);
        const stringUserId = String(currentUser._id);

        io.to(cIdStr).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'read', userId: stringUserId });
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv?.participants) {
          conv.participants.forEach(pId => {
            io.to(`user:${String(pId)}`).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'read', userId: stringUserId });
          });
        }
      }
    }

    // 2. Return updated messages
    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: currentUser._id }
    })
      .populate('sender', 'displayName avatarUrl username')
      .populate({
        path: 'replyTo',
        select: 'content sender isCodeSnippet caption isDeletedForEveryone',
        populate: { path: 'sender', select: 'displayName username' }
      })
      .sort({ sequence: 1, createdAt: 1, _id: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

export const markMessagesReadHttp = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const { messageIds } = req.body;
    let query = { conversationId, sender: { $ne: currentUser._id } };
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const unreadMessages = await Message.find(query).select('_id');
    if (unreadMessages.length > 0) {
      const ids = unreadMessages.map(m => m._id);
      await Message.updateMany(
        { _id: { $in: ids } },
        { $addToSet: { readBy: currentUser._id, deliveredTo: currentUser._id } }
      );

      const io = req.app.get('io');
      if (io) {
        const cIdStr = String(conversationId);
        const stringMsgIds = ids.map(String);
        const stringUserId = String(currentUser._id);

        io.to(cIdStr).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'read', userId: stringUserId });
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv?.participants) {
          conv.participants.forEach(pId => {
            io.to(`user:${String(pId)}`).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'read', userId: stringUserId });
          });
        }
      }
    }

    res.status(200).json({ success: true, count: unreadMessages.length });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages read', error: error.message });
  }
};

// Send message via HTTP fallback (guarantees real-time persistence even if socket is disconnected)
export const sendMessageHttp = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const {
      conversationId,
      content,
      caption,
      attachmentName,
      attachmentType,
      isCodeSnippet,
      language,
      replyTo,
      clientMessageId
    } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Missing conversationId or content' });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    // Check block list if direct
    if (conv.type === 'direct' && conv.participants && conv.participants.length === 2) {
      const recipientId = conv.participants.find(p => String(p) !== String(currentUser._id));
      if (recipientId) {
        const [senderUser, recipientUser] = await Promise.all([
          User.findById(currentUser._id).select('blockedUsers'),
          User.findById(recipientId).select('blockedUsers')
        ]);
        if (recipientUser?.blockedUsers?.some(id => String(id) === String(currentUser._id))) {
          return res.status(403).json({ message: 'You cannot send messages to this contact because you are blocked.' });
        }
        if (senderUser?.blockedUsers?.some(id => String(id) === String(recipientId))) {
          return res.status(403).json({ message: 'You have blocked this contact. Unblock them to send messages.' });
        }
      }
    }

    const convSequence = await Conversation.findByIdAndUpdate(
      conversationId,
      { $inc: { messageSequence: 1 } },
      { new: true }
    );
    const sequence = convSequence ? convSequence.messageSequence : 1;

    const newMessage = new Message({
      conversationId,
      sender: currentUser._id,
      clientMessageId: clientMessageId || '',
      content,
      caption: caption || '',
      attachmentName: attachmentName || '',
      attachmentType: attachmentType || '',
      isCodeSnippet: !!isCodeSnippet,
      language: language || 'plaintext',
      replyTo: replyTo || undefined,
      sequence
    });

    await newMessage.save();
    await newMessage.populate([
      { path: 'sender', select: 'displayName avatarUrl username' },
      { path: 'replyTo', select: 'content sender isCodeSnippet caption isDeletedForEveryone', populate: { path: 'sender', select: 'displayName username' } }
    ]);

    const updatedConv = await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
      updatedAt: new Date(),
      $pull: { deletedFor: currentUser._id }
    }, { new: true });

    const messageToEmit = newMessage.toObject();
    if (clientMessageId) messageToEmit.clientMessageId = clientMessageId;

    const io = req.app.get('io');
    if (io) {
      let broadcast = io.to(String(conversationId));
      if (updatedConv?.participants) {
        updatedConv.participants.forEach(pId => {
          broadcast = broadcast.to(`user:${String(pId)}`);
        });
      }
      broadcast.emit('receive_message', messageToEmit);

      // Send Web Push to offline participants
      if (updatedConv?.participants) {
        const senderName = currentUser.displayName || currentUser.username || 'Someone';
        const snippetText = isCodeSnippet ? '[Code Snippet]' : (caption || (typeof content === 'string' ? content.slice(0, 100) : 'New message'));
        updatedConv.participants.forEach(pId => {
          if (String(pId) !== String(currentUser._id)) {
            sendPushNotificationToUser(pId, {
              title: updatedConv.type === 'group' ? `${senderName} in #${updatedConv.name || 'group'}` : senderName,
              body: snippetText,
              icon: currentUser.avatarUrl || '/favicon.ico',
              conversationId
            });
          }
        });
      }
      // In-Chat AI Assistant trigger
      handleInChatAiTrigger({ message: newMessage, conversationId, io }).catch(err => {
        console.error('AI in-chat HTTP trigger error:', err);
      });
    }

    res.status(201).json(messageToEmit);
  } catch (error) {
    console.error('Error sending message HTTP:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Add a line review comment to a code snippet message
export const addCodeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { lineNumber, comment } = req.body;
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });
    if (!comment || typeof lineNumber !== 'number') {
      return res.status(400).json({ message: 'Line number and comment are required' });
    }

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const newReview = {
      lineNumber,
      author: currentUser._id,
      authorName: currentUser.displayName || currentUser.username || 'Developer',
      comment,
      createdAt: new Date(),
      resolved: false
    };

    message.codeReviews.push(newReview);
    await message.save();

    const populatedReview = message.codeReviews[message.codeReviews.length - 1];

    const io = req.app.get('io');
    if (io) {
      io.to(String(message.conversationId)).emit('code_review_added', {
        messageId: message._id,
        conversationId: message.conversationId,
        review: populatedReview
      });
    }

    res.status(201).json({ success: true, review: populatedReview });
  } catch (error) {
    console.error('Error adding code review:', error);
    res.status(500).json({ message: 'Error adding code review', error: error.message });
  }
};

// Toggle resolve status on a line review comment
export const toggleResolveCodeReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const review = message.codeReviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.resolved = !review.resolved;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(String(message.conversationId)).emit('code_review_updated', {
        messageId: message._id,
        conversationId: message.conversationId,
        reviewId,
        resolved: review.resolved
      });
    }

    res.status(200).json({ success: true, review });
  } catch (error) {
    console.error('Error toggling code review resolve:', error);
    res.status(500).json({ message: 'Error updating code review', error: error.message });
  }
};

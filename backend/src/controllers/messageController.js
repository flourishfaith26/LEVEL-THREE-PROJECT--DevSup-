import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

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

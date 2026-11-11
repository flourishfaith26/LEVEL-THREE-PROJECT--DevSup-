import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import CallLog from '../models/CallLog.js';
import User from '../models/User.js';

// Memory store tracks every active socket for a user across their devices.
const onlineUsers = new Map();

const getUserRoom = (userId) => `user:${String(userId)}`;

const getNextMessageSequence = async (conversationId) => {
    const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { $inc: { messageSequence: 1 } },
        { new: true, projection: { messageSequence: 1 } }
    );

    if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
    }

    return conversation.messageSequence;
};

export const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // 1. Track User Coming Online
        socket.on('user_connected', async (userId) => {
            const normalizedUserId = String(userId);
            const userSockets = onlineUsers.get(normalizedUserId) || new Set();
            userSockets.add(socket.id);
            onlineUsers.set(normalizedUserId, userSockets);
            socket.data.userId = normalizedUserId;
            socket.join(getUserRoom(normalizedUserId));
            // Broadcast the array of active User IDs to all connected clients
            io.emit('presence_update', Array.from(onlineUsers.keys()));

            // Auto-mark undelivered messages in conversations for this user as delivered
            try {
                if (mongoose.Types.ObjectId.isValid(normalizedUserId)) {
                    const userObjId = new mongoose.Types.ObjectId(normalizedUserId);
                    const userConvs = await Conversation.find({ participants: userObjId }).select('_id');
                    const convIds = userConvs.map(c => c._id);
                    if (convIds.length > 0) {
                        const undeliveredMessages = await Message.find({
                            conversationId: { $in: convIds },
                            sender: { $ne: userObjId },
                            deliveredTo: { $ne: userObjId }
                        }).select('_id conversationId');

                        if (undeliveredMessages.length > 0) {
                            const undeliveredIds = undeliveredMessages.map(m => m._id);
                            await Message.updateMany(
                                { _id: { $in: undeliveredIds } },
                                { $addToSet: { deliveredTo: userObjId } }
                            );

                            const byConv = {};
                            undeliveredMessages.forEach(m => {
                                const cId = String(m.conversationId);
                                if (!byConv[cId]) byConv[cId] = [];
                                byConv[cId].push(String(m._id));
                            });

                            for (const [cId, ids] of Object.entries(byConv)) {
                                io.to(cId).emit('messages_status_updated', { messageIds: ids, status: 'delivered', userId: normalizedUserId });
                                const cDoc = await Conversation.findById(cId).select('participants');
                                if (cDoc?.participants) {
                                    cDoc.participants.forEach(pId => {
                                        io.to(getUserRoom(pId)).emit('messages_status_updated', { messageIds: ids, status: 'delivered', userId: normalizedUserId });
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (deliveryErr) {
                console.error('Error auto-marking delivered on user connect:', deliveryErr);
            }
        });

        // 2. Room Joining
        socket.on('join_room', (conversationId) => {
            socket.join(conversationId);
        });

        // 3. Message Handling
        socket.on('send_message', async (messageData, acknowledge) => {
            try {
                const conv = await Conversation.findById(messageData.conversationId);
                if (!conv) {
                    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Conversation not found' });
                    return;
                }

                // If direct message, check if either user blocked the other
                if (conv.type === 'direct' && conv.participants && conv.participants.length === 2) {
                    const recipientId = conv.participants.find(p => p.toString() !== String(messageData.senderId));
                    if (recipientId) {
                        const [senderUser, recipientUser] = await Promise.all([
                            User.findById(messageData.senderId).select('blockedUsers'),
                            User.findById(recipientId).select('blockedUsers')
                        ]);

                        if (recipientUser?.blockedUsers?.some(id => id.toString() === String(messageData.senderId))) {
                            if (typeof acknowledge === 'function') {
                                acknowledge({ ok: false, error: 'You cannot send messages to this contact because you are blocked.' });
                            }
                            return;
                        }

                        if (senderUser?.blockedUsers?.some(id => id.toString() === String(recipientId))) {
                            if (typeof acknowledge === 'function') {
                                acknowledge({ ok: false, error: 'You have blocked this contact. Unblock them to send messages.' });
                            }
                            return;
                        }
                    }
                }

                const sequence = await getNextMessageSequence(messageData.conversationId);
                const newMessage = new Message({
                    conversationId: messageData.conversationId,
                    sender: messageData.senderId,
                    clientMessageId: messageData.clientMessageId || '',
                    content: messageData.content,
                    caption: messageData.caption || '',
                    attachmentName: messageData.attachmentName || '',
                    attachmentType: messageData.attachmentType || '',
                    isCodeSnippet: messageData.isCodeSnippet,
                    language: messageData.language,
                    replyTo: messageData.replyTo,
                    sequence
                });
                
                await newMessage.save();
                await newMessage.populate([
                    { path: 'sender', select: 'displayName avatarUrl username' },
                    { path: 'replyTo', select: 'content sender isCodeSnippet caption isDeletedForEveryone', populate: { path: 'sender', select: 'displayName username' } }
                ]);
                
                // If conversation was hidden (deletedFor), restore it for the sender so they see it again
                const updatedConv = await Conversation.findByIdAndUpdate(messageData.conversationId, {
                    lastMessage: newMessage._id,
                    updatedAt: new Date(),
                    $pull: { deletedFor: messageData.senderId }
                }, { new: true });

                const messageToEmit = newMessage.toObject();
                if (messageData.clientMessageId) messageToEmit.clientMessageId = messageData.clientMessageId;

                // Deduplicated multi-room broadcast: Socket.IO chains .to() so each client socket receives event once
                let broadcast = io.to(messageData.conversationId);
                if (updatedConv?.participants) {
                    updatedConv.participants.forEach(pId => {
                        broadcast = broadcast.to(getUserRoom(pId));
                    });
                }
                broadcast.emit('receive_message', messageToEmit);

                if (typeof acknowledge === 'function') acknowledge({ ok: true, message: messageToEmit });
            } catch (error) {
                console.error('Error handling socket message:', error);
                if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Message could not be sent' });
            }
        });

        socket.on('edit_message', async ({ messageId, newContent, conversationId }) => {
            try {
                const updatedMsg = await Message.findByIdAndUpdate(
                    messageId, 
                    { content: newContent, isEdited: true },
                    { new: true }
                ).populate('sender', 'displayName avatarUrl username');

                if (updatedMsg) {
                    io.to(conversationId).emit('message_edited', updatedMsg);
                    const conv = await Conversation.findById(conversationId);
                    if (conv?.participants) {
                        conv.participants.forEach(pId => {
                            io.to(getUserRoom(pId)).emit('message_edited', updatedMsg);
                        });
                    }
                }
            } catch (error) {
                console.error('Error editing message:', error);
            }
        });

        socket.on('delete_message_for_everyone', async ({ messageIds, conversationId }, acknowledge) => {
            try {
                if (!Array.isArray(messageIds) || messageIds.length === 0 || !conversationId) {
                    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'No messages were selected' });
                    return;
                }

                const senderId = socket.data.userId;
                if (!senderId) {
                    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'You must be connected to delete messages' });
                    return;
                }

                const conversation = await Conversation.findOne({ _id: conversationId, participants: senderId });
                if (!conversation) {
                    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Conversation not found' });
                    return;
                }

                const normalizedIds = [...new Set(messageIds.map(String))];
                const ownedMessages = await Message.find({
                    _id: { $in: normalizedIds },
                    conversationId,
                    sender: senderId,
                    isDeletedForEveryone: { $ne: true }
                }).select('_id');

                if (ownedMessages.length !== normalizedIds.length) {
                    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'You can only delete your own messages for everyone' });
                    return;
                }

                const deletedIds = ownedMessages.map(message => String(message._id));
                const deletionEvent = {
                    messageIds: deletedIds,
                    conversationId: String(conversationId),
                    senderId: String(senderId)
                };

                // Emit immediately for zero-latency UI update across all clients
                io.to(conversationId).emit('messages_deleted_for_everyone', deletionEvent);
                conversation.participants.forEach(pId => {
                    io.to(getUserRoom(pId)).emit('messages_deleted_for_everyone', deletionEvent);
                });
                if (typeof acknowledge === 'function') acknowledge({ ok: true, deletedIds });

                // Perform heavy DB operations in the background
                await Message.updateMany(
                    { _id: { $in: deletedIds }, conversationId, sender: senderId },
                    {
                        $set: {
                            content: '',
                            caption: '',
                            attachmentName: '',
                            attachmentType: '',
                            isCodeSnippet: false,
                            isEdited: false,
                            isDeletedForEveryone: true
                        },
                        $unset: { replyTo: 1 }
                    }
                );
            } catch (error) {
                console.error('Error deleting messages for everyone:', error);
                if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Message deletion failed' });
            }
        });

        socket.on('delete_message_for_me', async ({ messageIds, conversationId, userId }, acknowledge) => {
            try {
                if (!Array.isArray(messageIds) || messageIds.length === 0 || !conversationId || !userId) {
                    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'No messages were selected' });
                    return;
                }

                const normalizedIds = messageIds.map(String);
                
                // Optimistically acknowledge and emit back to this socket to update their local state immediately
                if (typeof acknowledge === 'function') acknowledge({ ok: true, deletedIds: normalizedIds });
                socket.emit('messages_deleted_for_me', normalizedIds);

                // Perform heavy DB operations in the background
                await Message.updateMany(
                    { _id: { $in: normalizedIds }, conversationId },
                    { $addToSet: { deletedFor: userId } }
                );
            } catch (error) {
                console.error('Error deleting messages for me:', error);
                if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Message deletion failed' });
            }
        });

        socket.on('mark_messages_delivered', async ({ conversationId, userId, messageIds }) => {
            try {
                if (!messageIds || messageIds.length === 0) return;
                const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
                const validMsgIds = messageIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
                if (validMsgIds.length === 0) return;

                await Message.updateMany(
                    { _id: { $in: validMsgIds } },
                    { $addToSet: { deliveredTo: userObjId } }
                );

                const cIdStr = String(conversationId);
                const stringMsgIds = validMsgIds.map(String);
                const stringUserId = String(userId);

                io.to(cIdStr).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'delivered', userId: stringUserId });
                const conv = await Conversation.findById(conversationId);
                if (conv?.participants) {
                    conv.participants.forEach(pId => {
                        io.to(getUserRoom(pId)).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'delivered', userId: stringUserId });
                    });
                }
            } catch (error) {
                console.error('Error marking delivered:', error);
            }
        });

        socket.on('mark_messages_read', async ({ conversationId, userId, messageIds }) => {
            try {
                if (!messageIds || messageIds.length === 0) return;
                const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
                const validMsgIds = messageIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
                if (validMsgIds.length === 0) return;

                await Message.updateMany(
                    { _id: { $in: validMsgIds } },
                    { $addToSet: { readBy: userObjId, deliveredTo: userObjId } }
                );

                const cIdStr = String(conversationId);
                const stringMsgIds = validMsgIds.map(String);
                const stringUserId = String(userId);

                io.to(cIdStr).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'read', userId: stringUserId });
                const conv = await Conversation.findById(conversationId);
                if (conv?.participants) {
                    conv.participants.forEach(pId => {
                        io.to(getUserRoom(pId)).emit('messages_status_updated', { messageIds: stringMsgIds, status: 'read', userId: stringUserId });
                    });
                }
            } catch (error) {
                console.error('Error marking read:', error);
            }
        });

        socket.on('delete_conversation', async ({ conversationId, userId }) => {
            try {
                const convo = await Conversation.findById(conversationId);
                if (!convo) return;
                
                // Add user to deletedFor array of the conversation
                await Conversation.findByIdAndUpdate(
                    conversationId,
                    { $addToSet: { deletedFor: userId } }
                );

                // Also delete all existing messages for this user in this conversation so they don't see them if the chat comes back
                await Message.updateMany(
                    { conversationId },
                    { $addToSet: { deletedFor: userId } }
                );

                // Notify ONLY this user so they can update their sidebar
                io.to(getUserRoom(userId)).emit('conversation_deleted', conversationId);
            } catch (error) {
                console.error('Error deleting conversation:', error);
            }
        });

        socket.on('leave_conversation', async ({ conversationId, userId }) => {
            try {
                const convo = await Conversation.findById(conversationId);
                if (!convo || convo.type !== 'group') return;

                // Remove the user from participants and admins
                convo.participants = convo.participants.filter(p => p.toString() !== userId);
                convo.admins = convo.admins.filter(a => a.toString() !== userId);
                await convo.save();

                // Tell the leaving user to remove the conversation from their sidebar
                io.to(getUserRoom(userId)).emit('conversation_deleted', conversationId);

                // Notify remaining participants that the member list changed
                convo.participants.forEach(p => {
                    io.to(getUserRoom(p)).emit('member_left', { conversationId, userId });
                });
            } catch (error) {
                console.error('Error leaving conversation:', error);
            }
        });

        // 4. Whiteboard Handling
        socket.on('whiteboard_draw', (drawData) => {
            socket.to(drawData.conversationId).emit('whiteboard_draw', drawData);
        });

        // 5. WebRTC Signaling
        socket.on('call_user', async ({ userToCall, signalData, from, callerInfo, callType, conversationId }, acknowledge) => {
            try {
                const [callerUser, calleeUser] = await Promise.all([
                    User.findById(from).select('blockedUsers'),
                    User.findById(userToCall).select('blockedUsers')
                ]);

                if (calleeUser?.blockedUsers?.some(id => id.toString() === String(from))) {
                    acknowledge?.({ ok: false, error: 'Call failed. You are blocked by this user.' });
                    return;
                }
                if (callerUser?.blockedUsers?.some(id => id.toString() === String(userToCall))) {
                    acknowledge?.({ ok: false, error: 'Call failed. You have blocked this user.' });
                    return;
                }
            } catch (err) {
                console.error('Error checking block status for call:', err);
            }

            const callPayload = {
                signal: signalData,
                from: String(from),
                callerInfo,
                callType: (callType === 'video') ? 'video' : 'audio',
                conversationId: conversationId || undefined
            };

            // Retry delivering the call for up to 10 seconds to handle Render cold-start
            // reconnect races where the callee's socket re-joins their room slightly late.
            const MAX_WAIT_MS = 10000;
            const RETRY_INTERVAL_MS = 500;
            let elapsed = 0;

            const tryDeliver = async () => {
                const targetSockets = await io.in(getUserRoom(userToCall)).allSockets();
                if (targetSockets.size > 0) {
                    io.to(getUserRoom(userToCall)).emit('call_user', callPayload);
                    acknowledge?.({ ok: true });
                    return;
                }
                if (elapsed >= MAX_WAIT_MS) {
                    acknowledge?.({ ok: false, error: 'The person is not connected.' });
                    return;
                }
                elapsed += RETRY_INTERVAL_MS;
                setTimeout(tryDeliver, RETRY_INTERVAL_MS);
            };

            await tryDeliver();
        });

        socket.on('answer_call', async ({ to, signal }, acknowledge) => {
            const callerRoom = getUserRoom(to);
            const callerSockets = await io.in(callerRoom).allSockets();
            if (callerSockets.size === 0) {
                acknowledge?.({ ok: false, error: 'The caller is no longer connected.' });
                return;
            }
            io.to(callerRoom).emit('call_accepted', signal);
            acknowledge?.({ ok: true });
        });

        socket.on('webrtc_ice_candidate', ({ to, candidate }) => {
            io.to(getUserRoom(to)).emit('webrtc_ice_candidate', candidate);
        });

        socket.on('end_call', ({ to }) => {
            io.to(getUserRoom(to)).emit('call_ended');
        });

        socket.on('reject_call', ({ to }) => {
            io.to(getUserRoom(to)).emit('call_rejected');
        });

        socket.on('log_call', async ({ callerId, receiverId, conversationId, type, status }) => {
            try {
                // Normalize type: both 'audio' and 'voice' map to 'audio', ensuring both voice and video calls log reliably
                const normalizedType = (type === 'video') ? 'video' : 'audio';
                const normalizedStatus = ['completed', 'missed', 'rejected'].includes(status) ? status : 'completed';

                let convId = conversationId;
                if (!convId && callerId && receiverId) {
                    const directConv = await Conversation.findOne({
                        type: 'direct',
                        participants: { $all: [callerId, receiverId] }
                    });
                    if (directConv) {
                        convId = String(directConv._id);
                    }
                }

                const newLog = await CallLog.create({
                    caller: callerId,
                    receiver: receiverId || undefined,
                    conversation: convId || undefined,
                    type: normalizedType,
                    status: normalizedStatus
                });
                const populatedLog = await CallLog.findById(newLog._id).populate('caller receiver conversation');
                
                if (convId) {
                    const conv = await Conversation.findById(convId);
                    if (conv && conv.participants) {
                        conv.participants.forEach(pId => {
                            io.to(getUserRoom(pId)).emit('call_logged', populatedLog);
                        });

                        const newMessage = new Message({
                            conversationId: convId,
                            sender: callerId,
                            content: `$CALL_LOG$|${normalizedType}|${normalizedStatus}`,
                            caption: '',
                            sequence: await getNextMessageSequence(convId)
                        });
                        
                        await newMessage.save();
                        await newMessage.populate([
                            { path: 'sender', select: 'displayName avatarUrl' }
                        ]);
                        
                        await Conversation.findByIdAndUpdate(convId, {
                            lastMessage: newMessage._id,
                            updatedAt: new Date()
                        });
                        
                        conv.participants.forEach(pId => {
                            io.to(getUserRoom(pId)).emit('receive_message', newMessage);
                        });
                    }
                } else {
                    io.to(getUserRoom(callerId)).emit('call_logged', populatedLog);
                    if (receiverId) io.to(getUserRoom(receiverId)).emit('call_logged', populatedLog);
                }
            } catch(e) {
                console.error('Error logging call:', e);
            }
        });

        // 6. Track User Going Offline
        socket.on('disconnect', () => {
            const userId = socket.data.userId;
            if (userId) {
                const userSockets = onlineUsers.get(userId);
                if (userSockets) {
                    userSockets.delete(socket.id);
                }
                if (userSockets?.size === 0) {
                    onlineUsers.delete(userId);
                }
                io.emit('presence_update', Array.from(onlineUsers.keys()));
            }
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

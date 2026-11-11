import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import CallLog from '../models/CallLog.js';
import User from '../models/User.js';
import { askGemini } from '../routers/aiRoutes.js';

// Memory store tracks every active socket for a user across their devices.
const onlineUsers = new Map();
// Memory store for active audio huddles: conversationId -> Map(userId -> { user, socketId, isMuted, isSpeaking })
const activeHuddles = new Map();

const getHuddleSummary = () => {
    const summary = {};
    activeHuddles.forEach((membersMap, convId) => {
        if (membersMap.size > 0) {
            summary[convId] = Array.from(membersMap.values()).map(m => ({
                id: String(m.user?._id || m.user?.id),
                name: m.user?.displayName || m.user?.name || 'Developer',
                avatar: m.user?.avatarUrl || m.user?.avatar || '',
                isMuted: m.isMuted,
                isSpeaking: m.isSpeaking,
                socketId: m.socketId
            }));
        }
    });
    return summary;
};

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

                // In-Chat AI Assistant (@devsup-ai or @ai trigger)
                const contentStr = typeof messageData.content === 'string' ? messageData.content : '';
                const isAiTrigger = (contentStr.includes('@devsup-ai') || contentStr.includes('@ai') || contentStr.startsWith('/ai ')) && !contentStr.startsWith('$CALL_LOG$') && !contentStr.startsWith('$STATUS_REPLY$');
                if (isAiTrigger) {
                    (async () => {
                        try {
                            const cleanPrompt = contentStr.replace(/@devsup-ai|@ai|^\/ai\s+/gi, '').trim();
                            if (!cleanPrompt) return;

                            // Emit typing indicator for AI
                            io.to(messageData.conversationId).emit('typing_status', {
                                conversationId: messageData.conversationId,
                                userId: 'devsup-ai-system',
                                displayName: 'DevSup AI',
                                isTyping: true
                            });

                            let aiBot = await User.findOne({ username: 'devsup-ai' });
                            if (!aiBot) {
                                aiBot = await User.create({
                                    auth0Id: 'system|devsup-ai',
                                    displayName: 'DevSup AI',
                                    username: 'devsup-ai',
                                    email: 'ai@devsupchat.com',
                                    avatarUrl: '/logo.png',
                                    about: 'Official DevSup Engineering Assistant',
                                    techDiscipline: 'Fullstack'
                                });
                            }

                            // Fetch recent conversation context (last 5 messages)
                            const recentMessages = await Message.find({ 
                                conversationId: messageData.conversationId,
                                isDeletedForEveryone: { $ne: true }
                            })
                                .sort({ createdAt: -1 })
                                .limit(5)
                                .populate('sender', 'displayName username');

                            const contextHistory = recentMessages
                                .reverse()
                                .map(m => `${m.sender?.displayName || 'User'}: ${m.content}`)
                                .join('\n');

                            const aiReplyText = await askGemini(cleanPrompt, contextHistory);

                            const aiSeq = await getNextMessageSequence(messageData.conversationId);
                            const aiMessage = new Message({
                                conversationId: messageData.conversationId,
                                sender: aiBot._id,
                                content: aiReplyText,
                                replyTo: newMessage._id,
                                sequence: aiSeq
                            });

                            await aiMessage.save();
                            await aiMessage.populate([
                                { path: 'sender', select: 'displayName avatarUrl username' },
                                { path: 'replyTo', select: 'content sender isCodeSnippet caption isDeletedForEveryone', populate: { path: 'sender', select: 'displayName username' } }
                            ]);

                            await Conversation.findByIdAndUpdate(messageData.conversationId, {
                                lastMessage: aiMessage._id,
                                updatedAt: new Date()
                            });

                            io.to(messageData.conversationId).emit('typing_status', {
                                conversationId: messageData.conversationId,
                                userId: 'devsup-ai-system',
                                displayName: 'DevSup AI',
                                isTyping: false
                            });

                            let aiBroadcast = io.to(messageData.conversationId);
                            if (updatedConv?.participants) {
                                updatedConv.participants.forEach(pId => {
                                    aiBroadcast = aiBroadcast.to(getUserRoom(pId));
                                });
                            }
                            aiBroadcast.emit('receive_message', aiMessage.toObject());
                        } catch (aiErr) {
                            console.error('DevSup AI in-chat response failed:', aiErr);
                            io.to(messageData.conversationId).emit('typing_status', {
                                conversationId: messageData.conversationId,
                                userId: 'devsup-ai-system',
                                displayName: 'DevSup AI',
                                isTyping: false
                            });
                        }
                    })();
                }
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
        socket.on('call_user', async ({ userToCall, signalData, from, callerInfo, callType, conversationId, callSessionId }, acknowledge) => {
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
                conversationId: conversationId || undefined,
                callSessionId: callSessionId || undefined
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

        socket.on('end_call', ({ to, conversationId }) => {
            if (to) io.to(getUserRoom(to)).emit('call_ended');
            if (conversationId) socket.to(conversationId).emit('call_ended');
        });

        socket.on('reject_call', ({ to, conversationId }) => {
            if (to) io.to(getUserRoom(to)).emit('call_rejected');
            if (conversationId) socket.to(conversationId).emit('call_rejected');
        });

        socket.on('log_call', async ({ callerId, receiverId, conversationId, type, status, callSessionId, duration }) => {
            try {
                // Normalize type: both 'audio' and 'voice' map to 'audio', ensuring both voice and video calls log reliably
                const normalizedType = (type === 'video') ? 'video' : 'audio';
                const normalizedStatus = ['completed', 'missed', 'rejected'].includes(status) ? status : 'completed';

                let convId = conversationId;
                let targetReceiverId = receiverId;

                // If receiverId is missing but we have conversationId, resolve receiver from conversation
                if (!targetReceiverId && convId) {
                    const convDoc = await Conversation.findById(convId);
                    if (convDoc && convDoc.participants && convDoc.type === 'direct') {
                        const otherP = convDoc.participants.find(p => String(p._id || p) !== String(callerId));
                        if (otherP) {
                            targetReceiverId = String(otherP._id || otherP);
                        }
                    }
                }

                // If convId is missing but we have callerId and targetReceiverId, resolve direct conversation
                if (!convId && callerId && targetReceiverId) {
                    const directConv = await Conversation.findOne({
                        type: 'direct',
                        participants: { $all: [callerId, targetReceiverId] }
                    });
                    if (directConv) {
                        convId = String(directConv._id);
                    }
                }

                // Deduplicate: Check if this call was already logged (via callSessionId or within last 20 seconds)
                let existingLog = null;
                if (callSessionId) {
                    existingLog = await CallLog.findOne({ callSessionId });
                }
                if (!existingLog && callerId && targetReceiverId) {
                    const recentThreshold = new Date(Date.now() - 20000);
                    existingLog = await CallLog.findOne({
                        caller: callerId,
                        receiver: targetReceiverId,
                        createdAt: { $gte: recentThreshold }
                    });
                }

                if (existingLog) {
                    // Update existing log without creating a duplicate
                    if (normalizedStatus === 'completed' && existingLog.status !== 'completed') {
                        existingLog.status = 'completed';
                    }
                    if (duration && duration > (existingLog.duration || 0)) {
                        existingLog.duration = duration;
                    }
                    await existingLog.save();
                    return;
                }

                const newLog = await CallLog.create({
                    callSessionId: callSessionId || undefined,
                    caller: callerId,
                    receiver: targetReceiverId || undefined,
                    conversation: convId || undefined,
                    type: normalizedType,
                    status: normalizedStatus,
                    duration: duration || 0
                });

                const populatedLog = await CallLog.findById(newLog._id)
                    .populate('caller receiver')
                    .populate({
                        path: 'conversation',
                        populate: { path: 'participants', select: 'displayName avatarUrl techDiscipline username' }
                    });
                
                // Collect target user rooms to notify
                const targetRooms = new Set();
                if (callerId) targetRooms.add(getUserRoom(callerId));
                if (targetReceiverId) targetRooms.add(getUserRoom(targetReceiverId));

                if (convId) {
                    const conv = await Conversation.findById(convId);
                    if (conv && conv.participants) {
                        conv.participants.forEach(pId => {
                            targetRooms.add(getUserRoom(pId));
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
                }

                targetRooms.forEach(room => {
                    io.to(room).emit('call_logged', populatedLog);
                });
            } catch(e) {
                console.error('Error logging call:', e);
            }
        });

        // 6. Live Pair Programming & Collaborative Code Sync
        socket.on('code:join', ({ conversationId, user }) => {
            if (!conversationId) return;
            const roomName = `code:${conversationId}`;
            socket.join(roomName);
            socket.to(roomName).emit('code:peer_joined', { user, socketId: socket.id });
        });

        socket.on('code:leave', ({ conversationId, user }) => {
            if (!conversationId) return;
            const roomName = `code:${conversationId}`;
            socket.leave(roomName);
            socket.to(roomName).emit('code:peer_left', { user, socketId: socket.id });
        });

        socket.on('code:change', ({ conversationId, code, language, cursor, senderId, senderName }) => {
            if (!conversationId) return;
            socket.to(`code:${conversationId}`).emit('code:update', {
                code,
                language,
                cursor,
                senderId,
                senderName,
                timestamp: Date.now()
            });
        });

        socket.on('code:run:start', ({ conversationId, senderName, language }) => {
            if (!conversationId) return;
            socket.to(`code:${conversationId}`).emit('code:run:starting', {
                senderName,
                language,
                timestamp: Date.now()
            });
        });

        socket.on('code:run:result', ({ conversationId, output, senderName, language, executionTimeMs, success }) => {
            if (!conversationId) return;
            socket.to(`code:${conversationId}`).emit('code:run:completed', {
                output,
                senderName,
                language,
                executionTimeMs,
                success,
                timestamp: Date.now()
            });
        });

        // 7. Drop-in Persistent Audio Huddle & Voice Lounge
        socket.on('huddle:get_active', (callback) => {
            if (typeof callback === 'function') {
                callback(getHuddleSummary());
            }
        });

        socket.on('huddle:join', ({ conversationId, user, isMuted = false }) => {
            if (!conversationId || !user) return;
            const convId = String(conversationId);
            const userId = String(user._id || user.id);

            if (!activeHuddles.has(convId)) {
                activeHuddles.set(convId, new Map());
            }

            const members = activeHuddles.get(convId);
            members.set(userId, {
                user,
                socketId: socket.id,
                isMuted: !!isMuted,
                isSpeaking: false,
                joinedAt: Date.now()
            });

            socket.data.huddleConvId = convId;
            socket.data.huddleUserId = userId;
            socket.join(`huddle:${convId}`);

            const memberList = Array.from(members.values()).map(m => ({
                id: String(m.user?._id || m.user?.id),
                name: m.user?.displayName || m.user?.name || 'Developer',
                avatar: m.user?.avatarUrl || m.user?.avatar || '',
                isMuted: m.isMuted,
                isSpeaking: m.isSpeaking,
                socketId: m.socketId
            }));

            // Notify everyone in the huddle room
            io.to(`huddle:${convId}`).emit('huddle:updated', {
                conversationId: convId,
                members: memberList,
                joinedUser: user
            });

            // Global broadcast for channel indicators
            io.emit('huddle:presence_updated', getHuddleSummary());
        });

        socket.on('huddle:leave', ({ conversationId, user }) => {
            const convId = String(conversationId || socket.data.huddleConvId || '');
            const userId = String(user?._id || user?.id || socket.data.huddleUserId || '');

            if (convId && activeHuddles.has(convId)) {
                const members = activeHuddles.get(convId);
                members.delete(userId);
                if (members.size === 0) {
                    activeHuddles.delete(convId);
                }
                socket.leave(`huddle:${convId}`);
                socket.data.huddleConvId = null;
                socket.data.huddleUserId = null;

                const memberList = Array.from(members.values()).map(m => ({
                    id: String(m.user?._id || m.user?.id),
                    name: m.user?.displayName || m.user?.name || 'Developer',
                    avatar: m.user?.avatarUrl || m.user?.avatar || '',
                    isMuted: m.isMuted,
                    isSpeaking: m.isSpeaking,
                    socketId: m.socketId
                }));

                io.to(`huddle:${convId}`).emit('huddle:updated', {
                    conversationId: convId,
                    members: memberList,
                    leftUserId: userId
                });

                io.emit('huddle:presence_updated', getHuddleSummary());
            }
        });

        socket.on('huddle:state_change', ({ conversationId, isMuted, isSpeaking }) => {
            const convId = String(conversationId || socket.data.huddleConvId || '');
            const userId = String(socket.data.huddleUserId || '');

            if (convId && activeHuddles.has(convId)) {
                const members = activeHuddles.get(convId);
                const member = members.get(userId);
                if (member) {
                    if (typeof isMuted === 'boolean') member.isMuted = isMuted;
                    if (typeof isSpeaking === 'boolean') member.isSpeaking = isSpeaking;
                    io.to(`huddle:${convId}`).emit('huddle:member_state', {
                        conversationId: convId,
                        userId,
                        isMuted: member.isMuted,
                        isSpeaking: member.isSpeaking
                    });
                }
            }
        });

        socket.on('huddle:signal', ({ toSocketId, signal, fromUser, conversationId }) => {
            if (toSocketId) {
                io.to(toSocketId).emit('huddle:signal', {
                    signal,
                    fromSocketId: socket.id,
                    fromUser,
                    conversationId
                });
            }
        });

        // 8. Track User Going Offline
        socket.on('disconnect', () => {
            // Clean up huddle membership if user was in a huddle
            const huddleConvId = socket.data.huddleConvId;
            const huddleUserId = socket.data.huddleUserId;
            if (huddleConvId && activeHuddles.has(huddleConvId)) {
                const members = activeHuddles.get(huddleConvId);
                members.delete(huddleUserId);
                if (members.size === 0) {
                    activeHuddles.delete(huddleConvId);
                }
                io.to(`huddle:${huddleConvId}`).emit('huddle:updated', {
                    conversationId: huddleConvId,
                    members: Array.from(members.values()),
                    leftUserId: huddleUserId
                });
                io.emit('huddle:presence_updated', getHuddleSummary());
            }

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

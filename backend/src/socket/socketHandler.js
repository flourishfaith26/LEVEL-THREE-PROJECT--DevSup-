import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import CallLog from '../models/CallLog.js';

// Memory store to map actual User IDs to their active Socket session
const onlineUsers = new Map();

export const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // 1. Track User Coming Online
        socket.on('user_connected', (userId) => {
            onlineUsers.set(userId, socket.id);
            // Broadcast the array of active User IDs to all connected clients
            io.emit('presence_update', Array.from(onlineUsers.keys()));
        });

        // 2. Room Joining
        socket.on('join_room', (conversationId) => {
            socket.join(conversationId);
        });

        // 3. Message Handling
        socket.on('send_message', async (messageData) => {
            try {
                const newMessage = new Message({
                    conversationId: messageData.conversationId,
                    sender: messageData.senderId,
                    content: messageData.content,
                    caption: messageData.caption || '',
                    isCodeSnippet: messageData.isCodeSnippet,
                    language: messageData.language
                });
                
                await newMessage.save();
                await newMessage.populate('sender', 'displayName avatarUrl');
                
                await Conversation.findByIdAndUpdate(messageData.conversationId, {
                    lastMessage: newMessage._id,
                    updatedAt: new Date()
                });

                io.to(messageData.conversationId).emit('receive_message', newMessage);
            } catch (error) {
                console.error('Error handling socket message:', error);
            }
        });

        socket.on('edit_message', async ({ messageId, newContent, conversationId }) => {
            try {
                const updatedMsg = await Message.findByIdAndUpdate(
                    messageId, 
                    { content: newContent, isEdited: true },
                    { new: true }
                ).populate('sender', 'displayName avatarUrl');

                if (updatedMsg) {
                    io.to(conversationId).emit('message_edited', updatedMsg);
                }
            } catch (error) {
                console.error('Error editing message:', error);
            }
        });

        socket.on('delete_message', async ({ messageId, conversationId }) => {
            try {
                await Message.findByIdAndDelete(messageId);
                io.to(conversationId).emit('message_deleted', messageId);
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        });

        socket.on('delete_conversation', async ({ conversationId }) => {
            try {
                const convo = await Conversation.findById(conversationId);
                if (!convo) return;
                
                // Delete all messages associated with the conversation
                await Message.deleteMany({ conversationId });
                // Delete the conversation itself
                await Conversation.findByIdAndDelete(conversationId);

                // Notify all participants so they can update their sidebar
                convo.participants.forEach(p => {
                    const participantSocket = onlineUsers.get(p.toString());
                    if (participantSocket) {
                        io.to(participantSocket).emit('conversation_deleted', conversationId);
                    }
                });
            } catch (error) {
                console.error('Error deleting conversation:', error);
            }
        });

        // 4. Whiteboard Handling
        socket.on('whiteboard_draw', (drawData) => {
            socket.to(drawData.conversationId).emit('whiteboard_draw', drawData);
        });

        // 5. WebRTC Signaling
        socket.on('call_user', async ({ userToCall, signalData, from, callerInfo, callType }) => {
            const targetSocket = onlineUsers.get(userToCall);
            if (targetSocket) {
                io.to(targetSocket).emit('call_user', {
                    signal: signalData,
                    from,
                    callerInfo,
                    callType
                });
            } else {
                // Receiver is offline, tell caller to end call UI
                io.to(socket.id).emit('call_rejected');
            }
        });

        socket.on('answer_call', ({ to, signal }) => {
            const targetSocket = onlineUsers.get(to);
            if (targetSocket) {
                io.to(targetSocket).emit('call_accepted', signal);
            }
        });

        socket.on('webrtc_ice_candidate', ({ to, candidate }) => {
            const targetSocket = onlineUsers.get(to);
            if (targetSocket) {
                io.to(targetSocket).emit('webrtc_ice_candidate', candidate);
            }
        });

        socket.on('end_call', ({ to }) => {
            const targetSocket = onlineUsers.get(to);
            if (targetSocket) {
                io.to(targetSocket).emit('call_ended');
            }
        });

        socket.on('reject_call', ({ to }) => {
            const targetSocket = onlineUsers.get(to);
            if (targetSocket) {
                io.to(targetSocket).emit('call_rejected');
            }
        });

        socket.on('log_call', async ({ callerId, receiverId, type, status }) => {
            try {
                const newLog = await CallLog.create({
                    caller: callerId,
                    receiver: receiverId,
                    type,
                    status
                });
                const populatedLog = await CallLog.findById(newLog._id).populate('caller receiver');
                
                const callerSocket = onlineUsers.get(callerId);
                const receiverSocket = onlineUsers.get(receiverId);
                
                if (callerSocket) io.to(callerSocket).emit('call_logged', populatedLog);
                if (receiverSocket) io.to(receiverSocket).emit('call_logged', populatedLog);
            } catch(e) {
                console.error('Error logging call:', e);
            }
        });

        // 6. Track User Going Offline
        socket.on('disconnect', () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    // Broadcast the newly updated list so green dots disappear on the frontend
                    io.emit('presence_update', Array.from(onlineUsers.keys()));
                    break;
                }
            }
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};
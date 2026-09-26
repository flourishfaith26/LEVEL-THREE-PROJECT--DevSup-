import Message from '../models/Message.js';

// Fetch all messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate('sender', 'displayName avatarUrl')
      .sort({ createdAt: 1 }); // Sort oldest to newest for chat UI

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};
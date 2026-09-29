import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// Get all conversations for the logged-in user
export const getUserConversations = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const conversations = await Conversation.find({
      participants: { $in: [currentUser._id] }
    })
      .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { type, participantIds, name, avatarUrl, description } = req.body;
    
    // For direct messages, check if a conversation already exists
    if (type === 'direct' && participantIds.length === 2) {
      const existingConvo = await Conversation.findOne({
        type: 'direct',
        participants: { $all: participantIds }
      }).populate('participants', 'displayName avatarUrl onlineStatus techDiscipline');
      
      if (existingConvo) return res.status(200).json(existingConvo);
    }

    let admins = [];
    if (type === 'group') {
      const auth0Id = req.auth?.payload?.sub;
      if (auth0Id) {
        const currentUser = await User.findOne({ auth0Id });
        if (currentUser) {
           admins.push(currentUser._id);
        }
      }
    }

    const newConversation = new Conversation({
      type,
      participants: participantIds,
      name: type === 'group' ? name : undefined,
      avatarUrl: type === 'group' ? avatarUrl : undefined,
      description: type === 'group' ? description : undefined,
      admins: type === 'group' ? admins : undefined
    });

    const savedConversation = await newConversation.save();
    
    // Populate the newly saved conversation before returning it to the frontend
    const populatedConversation = await Conversation.findById(savedConversation._id)
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline'); // Added populate here!

    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating conversation', error: error.message });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, description } = req.body;
    
    // Check if the user is an admin or participant (for simplicity, we assume if they can hit this, they are participants)
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    
    if (name !== undefined) conversation.name = name;
    if (avatarUrl !== undefined) conversation.avatarUrl = avatarUrl;
    if (description !== undefined) conversation.description = description;
    
    await conversation.save();
    
    const populatedConversation = await Conversation.findById(id)
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline');
        
    res.status(200).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating conversation', error: error.message });
  }
};
import Status from '../models/Status.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

// Create a new status
export const createStatus = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const { content, type, backgroundColor, caption } = req.body;
    
    if (!content || !type) {
      return res.status(400).json({ message: 'Content and type are required' });
    }

    const newStatus = new Status({
      uploader: currentUser._id,
      content,
      type,
      caption: caption || '',
      backgroundColor: backgroundColor || '#1E2B3C'
    });

    const savedStatus = await newStatus.save();
    
    // Populate uploader for the immediate response
    const populatedStatus = await Status.findById(savedStatus._id).populate('uploader', 'displayName avatarUrl');

    res.status(201).json(populatedStatus);
  } catch (error) {
    console.error("Error creating status:", error);
    res.status(500).json({ message: 'Error creating status', error: error.message });
  }
};

// Get statuses for user and contacts
export const getStatuses = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // Find all users the current user has conversations with
    const conversations = await Conversation.find({ participants: { $in: [currentUser._id] } });
    
    const contactIds = new Set();
    contactIds.add(currentUser._id.toString()); // Always include self

    conversations.forEach(c => {
      c.participants.forEach(pId => {
        contactIds.add(pId.toString());
      });
    });

    // Fetch all active statuses from these users
    // (Expired statuses are automatically removed by MongoDB TTL index, but we can also filter just in case)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const statuses = await Status.find({
      uploader: { $in: Array.from(contactIds) },
      createdAt: { $gt: twentyFourHoursAgo }
    })
    .populate('uploader', 'displayName avatarUrl')
    .sort({ createdAt: 1 }); // Sort oldest first (natural order for stories)

    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error fetching statuses:", error);
    res.status(500).json({ message: 'Error fetching statuses', error: error.message });
  }
};

// Mark a status as viewed
export const markViewed = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const statusId = req.params.id;
    
    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: 'Status not found' });
    
    if (!status.viewers.includes(currentUser._id)) {
      status.viewers.push(currentUser._id);
      await status.save();
    }

    res.status(200).json({ message: 'Status marked as viewed' });
  } catch (error) {
    console.error("Error marking status viewed:", error);
    res.status(500).json({ message: 'Error marking status viewed', error: error.message });
  }
};

// Delete a status
export const deleteStatus = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const statusId = req.params.id;
    const status = await Status.findById(statusId);
    
    if (!status) return res.status(404).json({ message: 'Status not found' });

    if (status.uploader.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this status' });
    }

    await Status.findByIdAndDelete(statusId);
    res.status(200).json({ message: 'Status deleted successfully' });
  } catch (error) {
    console.error("Error deleting status:", error);
    res.status(500).json({ message: 'Error deleting status', error: error.message });
  }
};

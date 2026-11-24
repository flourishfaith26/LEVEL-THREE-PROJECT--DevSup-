import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import crypto from 'crypto';

// Get all conversations for the logged-in user
export const getUserConversations = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await User.findOne({ auth0Id });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const conversations = await Conversation.find({
      participants: { $in: [currentUser._id] },
      deletedFor: { $ne: currentUser._id }
    })
      .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
      .populate('admins', 'displayName avatarUrl username')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const conversationIds = conversations.map(c => c._id);
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          sender: { $ne: currentUser._id },
          readBy: { $ne: currentUser._id },
          isDeletedForEveryone: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$conversationId',
          unreadCount: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map();
    unreadAgg.forEach(u => unreadMap.set(String(u._id), u.unreadCount));

    const enriched = conversations.map(c => {
      const cObj = c.toObject();
      cObj.unreadCount = unreadMap.get(String(c._id)) || 0;
      return cObj;
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { type, name, avatarUrl, description, isPublic, isCommunity, groupType, tags } = req.body;
    const participantIds = req.body.participantIds || req.body.participants || [];
    
    // For direct messages, check if a conversation already exists
    if (type === 'direct' && participantIds.length === 2) {
      const existingConvo = await Conversation.findOne({
        type: 'direct',
        participants: { $all: participantIds, $size: 2 }
      }).populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username');
      
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

    const isCom = (groupType === 'community' || isCommunity === true);
    const resolvedGroupType = isCom ? 'community' : 'group';
    const slugName = (name || 'hub').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
    const generatedInviteCode = `devsup-${slugName}-${crypto.randomBytes(3).toString('hex')}`;

    const newConversation = new Conversation({
      type,
      participants: participantIds,
      name: type === 'group' ? name : undefined,
      avatarUrl: type === 'group' ? avatarUrl : undefined,
      description: type === 'group' ? description : undefined,
      admins: type === 'group' ? admins : undefined,
      isPublic: type === 'group' ? isCom : false,
      groupType: type === 'group' ? resolvedGroupType : undefined,
      tags: Array.isArray(tags) ? tags : (isCom ? ['community', 'devsup'] : []),
      inviteCode: type === 'group' ? generatedInviteCode : undefined,
      allowAnyMemberToAdd: isCom ? true : false
    });

    const savedConversation = await newConversation.save();
    
    // Populate the newly saved conversation before returning it to the frontend
    const populatedConversation = await Conversation.findById(savedConversation._id)
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
        .populate('admins', 'displayName avatarUrl username')
        .populate('lastMessage');

    const io = req.app.get('io');
    if (io && populatedConversation) {
      populatedConversation.participants.forEach(p => {
        io.to(`user:${String(p._id || p)}`).emit('conversation_created', populatedConversation);
      });
    }

    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating conversation', error: error.message });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, description, allowAnyMemberToAdd, groupType, isPublic, tags } = req.body;
    
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    
    if (name !== undefined) conversation.name = name;
    if (avatarUrl !== undefined) conversation.avatarUrl = avatarUrl;
    if (description !== undefined) conversation.description = description;
    if (groupType !== undefined) conversation.groupType = groupType;
    if (isPublic !== undefined) conversation.isPublic = isPublic;
    if (tags !== undefined && Array.isArray(tags)) conversation.tags = tags;
    
    if (allowAnyMemberToAdd !== undefined) {
      // Check if user is admin safely
      const auth0Id = req.auth?.payload?.sub;
      if (auth0Id) {
        const currentUser = await User.findOne({ auth0Id });
        const userObjIdStr = currentUser?._id ? currentUser._id.toString() : '';
        const adminIds = (conversation.admins || []).map(a => (a?._id || a).toString());
        const firstParticipantId = conversation.participants?.[0] ? (conversation.participants[0]._id || conversation.participants[0]).toString() : null;
        
        const isAdmin = currentUser && (
          adminIds.includes(userObjIdStr) || 
          (adminIds.length === 0 && firstParticipantId === userObjIdStr)
        );
        
        if (isAdmin) {
          conversation.allowAnyMemberToAdd = !!allowAnyMemberToAdd;
        } else {
          return res.status(403).json({ message: 'Only admins can change member adding permissions' });
        }
      } else {
        conversation.allowAnyMemberToAdd = !!allowAnyMemberToAdd;
      }
    }
    
    await conversation.save();
    
    const populatedConversation = await Conversation.findById(id)
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
        .populate('admins', 'displayName avatarUrl username')
        .populate('lastMessage');

    const io = req.app.get('io');
    if (io) {
      io.to(String(id)).emit('conversation_updated', populatedConversation);
      if (populatedConversation?.participants) {
        populatedConversation.participants.forEach(p => {
          io.to(`user:${String(p._id || p)}`).emit('conversation_updated', populatedConversation);
        });
      }
    }
        
    res.status(200).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating conversation', error: error.message });
  }
};

export const addMembersToConversation = async (req, res) => {
  try {
    const { id } = req.params;
    let { newMemberIds, usernames } = req.body;
    
    let resolvedMemberIds = Array.isArray(newMemberIds) ? [...newMemberIds] : [];

    // If usernames are provided, resolve their user IDs
    if (Array.isArray(usernames) && usernames.length > 0) {
      const cleanUsernames = usernames.map(u => String(u).replace(/^@+/, '').trim().toLowerCase()).filter(Boolean);
      if (cleanUsernames.length > 0) {
        const matchedUsers = await User.find({ username: { $in: cleanUsernames } }).select('_id');
        matchedUsers.forEach(u => resolvedMemberIds.push(u._id.toString()));
      }
    }

    if (resolvedMemberIds.length === 0) {
      return res.status(400).json({ message: 'Invalid member IDs or usernames' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (conversation.type !== 'group') return res.status(400).json({ message: 'Cannot add members to a direct chat' });

    const auth0Id = req.auth?.payload?.sub;
    if (auth0Id) {
      const currentUser = await User.findOne({
        $or: [
          { auth0Id },
          { _id: mongoose.isValidObjectId(auth0Id) ? auth0Id : null },
          { email: req.auth?.payload?.email }
        ].filter(Boolean)
      });
      const userObjIdStr = currentUser?._id ? currentUser._id.toString() : '';
      const adminIds = (conversation.admins || []).map(a => (a?._id || a).toString());
      const participantIds = (conversation.participants || []).map(p => (p?._id || p).toString());
      const firstParticipantId = participantIds[0] || null;

      const isParticipant = participantIds.includes(userObjIdStr);
      const isExplicitAdmin = adminIds.includes(userObjIdStr);
      const isCreator = firstParticipantId === userObjIdStr;

      const canAdd = isExplicitAdmin || isCreator || conversation.allowAnyMemberToAdd || (adminIds.length === 0 && isParticipant);
      if (!canAdd) {
        return res.status(403).json({ message: 'Only admins can add members to this group. You can enable "Allow Members to Add Others" in Group Settings.' });
      }
    }

    // Add new members without duplicates
    const currentParticipantIds = conversation.participants.map(p => (p?._id || p).toString());
    const validUniqueNewObjectIds = resolvedMemberIds
      .filter(mId => mongoose.isValidObjectId(mId) && !currentParticipantIds.includes(String(mId)))
      .map(mId => new mongoose.Types.ObjectId(mId));
    
    if (validUniqueNewObjectIds.length > 0) {
      conversation.participants.push(...validUniqueNewObjectIds);
      await conversation.save();
    }

    const populatedConversation = await Conversation.findById(id)
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
        .populate('admins', 'displayName avatarUrl username')
        .populate('lastMessage');

    const io = req.app.get('io');
    if (io) {
      io.to(String(id)).emit('conversation_updated', populatedConversation);
      if (populatedConversation?.participants) {
        populatedConversation.participants.forEach(p => {
          io.to(`user:${String(p._id || p)}`).emit('conversation_updated', populatedConversation);
        });
      }
    }
        
    res.status(200).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error adding members', error: error.message });
  }
};

// Get public community channels for discovery
export const getPublicCommunities = async (req, res) => {
  try {
    const dummyNames = [
      'General Engineering',
      'Algorithms & LeetCode',
      'System Design Hub',
      'Frontend Wizards'
    ];
    const searchQuery = (req.query.search || req.query.q || '').trim();
    let query = {
      type: 'group',
      groupType: 'community',
      name: { $nin: dummyNames }
    };

    if (searchQuery) {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query = {
        type: 'group',
        groupType: 'community',
        name: { $nin: dummyNames },
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { tags: { $regex: escaped, $options: 'i' } }
        ]
      };
    }

    let communities = await Conversation.find(query)
      .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
      .populate('admins', 'displayName avatarUrl username')
      .sort({ updatedAt: -1 });

    res.status(200).json(communities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public communities', error: error.message });
  }
};

// Generate or retrieve invite code for a conversation
export const getOrCreateInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.inviteCode) {
      conversation.inviteCode = `dev-${crypto.randomBytes(4).toString('hex')}`;
      await conversation.save();
    }

    const frontendOrigin = process.env.FRONTEND_URL || 'https://frontend-tjte.vercel.app';
    const inviteUrl = `${frontendOrigin}/join/${conversation.inviteCode}`;

    res.status(200).json({
      inviteCode: conversation.inviteCode,
      inviteUrl,
      isPublic: conversation.isPublic
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating invite link', error: error.message });
  }
};

// Get public metadata for an invite code (accessible by guests)
export const getInviteMetadata = async (req, res) => {
  try {
    const { code } = req.params;
    const conversation = await Conversation.findOne({ inviteCode: code })
      .populate('admins', 'displayName avatarUrl username');

    if (!conversation) {
      return res.status(404).json({ message: 'Invalid or expired invite link.' });
    }

    res.status(200).json({
      name: conversation.name || 'Developer Conversation',
      description: conversation.description || '',
      type: conversation.type,
      memberCount: conversation.participants?.length || 0,
      avatarUrl: conversation.avatarUrl || '',
      tags: conversation.tags || [],
      isPublic: conversation.isPublic,
      admins: conversation.admins
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invite details', error: error.message });
  }
};

// Join conversation via invite code (authenticated)
export const joinConversationByInvite = async (req, res) => {
  try {
    const { code } = req.params;
    const auth0Id = req.auth?.payload?.sub;
    const currentUser = await User.findOne({ auth0Id });

    if (!currentUser) {
      return res.status(401).json({ message: 'User must be authenticated to join.' });
    }

    const conversation = await Conversation.findOne({ inviteCode: code });
    if (!conversation) {
      return res.status(404).json({ message: 'Invalid or expired invite link.' });
    }

    const currentParticipantIds = conversation.participants.map(p => p.toString());
    if (!currentParticipantIds.includes(currentUser._id.toString())) {
      conversation.participants.push(currentUser._id);
      await conversation.save();
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
      .populate('lastMessage');

    res.status(200).json({
      message: 'Joined successfully',
      conversation: populated
    });
  } catch (error) {
    res.status(500).json({ message: 'Error joining conversation', error: error.message });
  }
};
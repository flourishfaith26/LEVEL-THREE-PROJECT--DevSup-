import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
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
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { type, name, avatarUrl, description } = req.body;
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
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username');

    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating conversation', error: error.message });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, description, allowAnyMemberToAdd } = req.body;
    
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    
    if (name !== undefined) conversation.name = name;
    if (avatarUrl !== undefined) conversation.avatarUrl = avatarUrl;
    if (description !== undefined) conversation.description = description;
    
    if (allowAnyMemberToAdd !== undefined) {
      // Check if user is admin
      const auth0Id = req.auth?.payload?.sub;
      if (auth0Id) {
        const currentUser = await User.findOne({ auth0Id });
        const isAdmin = currentUser && (
          conversation.admins.some(adminId => adminId.toString() === currentUser._id.toString()) || 
          (conversation.admins.length === 0 && conversation.participants[0].toString() === currentUser._id.toString())
        );
        
        if (isAdmin) {
          conversation.allowAnyMemberToAdd = allowAnyMemberToAdd;
        } else {
          return res.status(403).json({ message: 'Only admins can change member adding permissions' });
        }
      }
    }
    
    await conversation.save();
    
    const populatedConversation = await Conversation.findById(id)
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username');
        
    res.status(200).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating conversation', error: error.message });
  }
};

export const addMembersToConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { newMemberIds } = req.body;
    
    if (!newMemberIds || !Array.isArray(newMemberIds) || newMemberIds.length === 0) {
      return res.status(400).json({ message: 'Invalid member IDs' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (conversation.type !== 'group') return res.status(400).json({ message: 'Cannot add members to a direct chat' });

    const auth0Id = req.auth?.payload?.sub;
    if (auth0Id) {
      const currentUser = await User.findOne({ auth0Id });
      const isAdmin = currentUser && (
        conversation.admins.some(adminId => adminId.toString() === currentUser._id.toString()) || 
        (conversation.admins.length === 0 && conversation.participants[0].toString() === currentUser._id.toString())
      );
      if (!isAdmin && !conversation.allowAnyMemberToAdd) {
        return res.status(403).json({ message: 'Only admins can add members to this group' });
      }
    }

    // Add new members without duplicates
    const currentParticipantIds = conversation.participants.map(p => p.toString());
    const uniqueNewIds = newMemberIds.filter(id => !currentParticipantIds.includes(id.toString()));
    
    conversation.participants.push(...uniqueNewIds);
    await conversation.save();

    const populatedConversation = await Conversation.findById(id)
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
        .populate('lastMessage');
        
    res.status(200).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Error adding members', error: error.message });
  }
};

// Get public community channels for discovery
export const getPublicCommunities = async (req, res) => {
  try {
    let communities = await Conversation.find({ type: 'group', isPublic: true })
      .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
      .populate('admins', 'displayName avatarUrl username')
      .sort({ updatedAt: -1 });

    // Seed default developer communities if none exist
    if (communities.length === 0) {
      const defaults = [
        {
          name: 'General Engineering',
          description: 'Architecture debates, engineering best practices, stack decisions, and dev discussions.',
          tags: ['general', 'architecture', 'best-practices'],
          isPublic: true,
          type: 'group',
          inviteCode: 'devsup-general'
        },
        {
          name: 'Algorithms & LeetCode',
          description: 'DSA practice, algorithmic complexity optimization, dynamic programming, and interview challenges.',
          tags: ['algorithms', 'leetcode', 'dsa', 'interviews'],
          isPublic: true,
          type: 'group',
          inviteCode: 'devsup-algorithms'
        },
        {
          name: 'System Design Hub',
          description: 'High-scale distributed systems, microservices, database sharding, caching, and event streaming.',
          tags: ['system-design', 'distributed-systems', 'backend'],
          isPublic: true,
          type: 'group',
          inviteCode: 'devsup-sysdesign'
        },
        {
          name: 'Frontend Wizards',
          description: 'React, TypeScript, CSS art, Vite, Next.js, and modern browser rendering techniques.',
          tags: ['frontend', 'react', 'typescript', 'ui-ux'],
          isPublic: true,
          type: 'group',
          inviteCode: 'devsup-frontend'
        }
      ];

      for (const d of defaults) {
        await Conversation.create(d);
      }

      communities = await Conversation.find({ type: 'group', isPublic: true })
        .populate('participants', 'displayName avatarUrl onlineStatus techDiscipline username')
        .populate('admins', 'displayName avatarUrl username');
    }

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
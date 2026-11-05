import User from '../models/User.js';
import { normalizeUsername, validateUsernameFormat } from '../utils/username.js';

export const syncUser = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub; 
    
    const { email, displayName, avatarUrl, techDiscipline } = req.body;

    const validAvatar = (avatarUrl && typeof avatarUrl === 'string' && !avatarUrl.includes('placeholder') && !avatarUrl.includes('ui-avatars')) ? avatarUrl.trim() : '/default-avatar.svg';

    let user = await User.findOne({ auth0Id });
    
    if (!user) {
      user = await User.create({ auth0Id, email, displayName, avatarUrl: validAvatar, techDiscipline });
    } else {
      // Only update email unconditionally
      user.email = email;
      // Do not overwrite user's custom avatar or display name if they already exist
      if (!user.avatarUrl || user.avatarUrl.includes('ui-avatars') || user.avatarUrl.includes('placeholder')) {
        user.avatarUrl = validAvatar;
      }
      if (!user.displayName) user.displayName = displayName;
      if (techDiscipline && !user.techDiscipline) user.techDiscipline = techDiscipline;
      if (user.username && !user.hasCompletedProfile) user.hasCompletedProfile = true;
      await user.save();
    }

    await user.populate('blockedUsers', '_id displayName username avatarUrl techDiscipline about');

    res.status(200).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Internal server error during user sync' });
  }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-__v');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;
        const { displayName, avatarUrl, about, techDiscipline, githubProfile, linkedinProfile, portfolioUrl, verificationProof, hasCompletedProfile, readReceipts, username } = req.body;

        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (about !== undefined) updateData.about = about;
        if (techDiscipline !== undefined) updateData.techDiscipline = techDiscipline;
        if (githubProfile !== undefined) updateData.githubProfile = githubProfile;
        if (linkedinProfile !== undefined) updateData.linkedinProfile = linkedinProfile;
        if (portfolioUrl !== undefined) updateData.portfolioUrl = portfolioUrl;
        if (verificationProof !== undefined) updateData.verificationProof = verificationProof;
        if (hasCompletedProfile !== undefined) updateData.hasCompletedProfile = hasCompletedProfile;
        if (readReceipts !== undefined) updateData.readReceipts = readReceipts;
        
        if (username !== undefined) {
            const cleanUsername = normalizeUsername(username);
            const validation = validateUsernameFormat(cleanUsername);
            if (!validation.isValid) {
                return res.status(400).json({ message: validation.error });
            }

            // Check if username is already taken by another user
            const existing = await User.findOne({
                username: cleanUsername,
                auth0Id: { $ne: auth0Id }
            });
            if (existing) {
                return res.status(409).json({ message: `@${cleanUsername} is already taken. Please choose another.` });
            }

            updateData.username = cleanUsername;
            updateData.hasCompletedProfile = true;
        }

        const user = await User.findOneAndUpdate(
            { auth0Id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Username is already taken. Please choose another.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error updating profile' });
    }
};

export const checkUsernameAvailability = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ available: false, message: 'Username is required.' });
        }

        const cleanUsername = normalizeUsername(username);
        const validation = validateUsernameFormat(cleanUsername);
        if (!validation.isValid) {
            return res.status(200).json({ 
                available: false, 
                normalized: cleanUsername,
                message: validation.error 
            });
        }

        const auth0Id = req.auth.payload.sub;
        const existing = await User.findOne({ 
            username: cleanUsername, 
            auth0Id: { $ne: auth0Id } 
        });

        if (existing) {
            return res.status(200).json({ 
                available: false, 
                normalized: cleanUsername,
                message: `@${cleanUsername} is already taken.` 
            });
        }

        return res.status(200).json({ 
            available: true, 
            normalized: cleanUsername,
            message: `@${cleanUsername} is available!` 
        });
    } catch (error) {
        console.error('Error checking username availability:', error);
        res.status(500).json({ available: false, message: 'Server error checking username.' });
    }
};

export const searchByUsername = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(200).json([]);
        }
        const cleanQuery = normalizeUsername(username);
        if (!cleanQuery) {
            return res.status(200).json([]);
        }
        const auth0Id = req.auth.payload.sub;
        const currentUser = await User.findOne({ auth0Id }).select('_id');

        // Escape regex special chars so queries match literal characters
        const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Find users whose username or displayName matches query
        const results = await User.find({
            $or: [
                { username: { $regex: escaped, $options: 'i' } },
                { displayName: { $regex: escaped, $options: 'i' } }
            ]
        }).select('_id displayName username avatarUrl techDiscipline onlineStatus').limit(25);

        // Map isSelf if the result matches the current user
        const mapped = results.map(u => ({
            ...u.toObject(),
            isSelf: currentUser?._id && u._id.toString() === currentUser._id.toString()
        }));

        // Sort results:
        // 1. Exact username match
        // 2. Username starts with query (e.g. typing 'f' shows usernames starting with 'f' first)
        // 3. DisplayName starts with query
        // 4. Alphabetical
        const sorted = [...mapped].sort((a, b) => {
            const aUser = (a.username || '').toLowerCase();
            const bUser = (b.username || '').toLowerCase();
            const aDisp = (a.displayName || '').toLowerCase();
            const bDisp = (b.displayName || '').toLowerCase();
            const q = cleanQuery.toLowerCase();

            if (aUser === q && bUser !== q) return -1;
            if (bUser === q && aUser !== q) return 1;

            const aUserStarts = aUser.startsWith(q);
            const bUserStarts = bUser.startsWith(q);
            if (aUserStarts && !bUserStarts) return -1;
            if (!aUserStarts && bUserStarts) return 1;

            const aDispStarts = aDisp.startsWith(q);
            const bDispStarts = bDisp.startsWith(q);
            if (aDispStarts && !bDispStarts) return -1;
            if (!aDispStarts && bDispStarts) return 1;

            return aUser.localeCompare(bUser);
        });

        res.status(200).json(sorted);
    } catch (error) {
        console.error('Error searching users by username:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const blockUser = async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;
        const { targetUserId } = req.params;

        const currentUser = await User.findOne({ auth0Id });
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        if (currentUser._id.toString() === targetUserId) {
            return res.status(400).json({ message: 'You cannot block yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

        if (!currentUser.blockedUsers) {
            currentUser.blockedUsers = [];
        }

        const alreadyBlocked = currentUser.blockedUsers.some(id => id.toString() === targetUserId);
        if (!alreadyBlocked) {
            currentUser.blockedUsers.push(targetUserId);
            await currentUser.save();
        }

        await currentUser.populate('blockedUsers', '_id displayName username avatarUrl techDiscipline about');

        res.status(200).json({ 
            success: true, 
            message: `User ${targetUser.displayName || targetUser.username} blocked`, 
            blockedUsers: currentUser.blockedUsers 
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Internal server error while blocking user' });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;
        const { targetUserId } = req.params;

        const currentUser = await User.findOne({ auth0Id });
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        if (!currentUser.blockedUsers) {
            currentUser.blockedUsers = [];
        }

        currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== targetUserId);
        await currentUser.save();

        await currentUser.populate('blockedUsers', '_id displayName username avatarUrl techDiscipline about');

        res.status(200).json({ 
            success: true, 
            message: 'User unblocked successfully', 
            blockedUsers: currentUser.blockedUsers 
        });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ message: 'Internal server error while unblocking user' });
    }
};

export const getBlockedUsers = async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;
        const currentUser = await User.findOne({ auth0Id }).populate('blockedUsers', '_id displayName username avatarUrl techDiscipline about');
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(currentUser.blockedUsers || []);
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        res.status(500).json({ message: 'Internal server error fetching blocked users' });
    }
};

export const lookupUser = async (req, res) => {
    try {
        const { identifier } = req.query;
        if (!identifier || typeof identifier !== 'string') {
            return res.status(400).json({ message: 'Username or email identifier is required.' });
        }
        const cleanIdentifier = identifier.trim().toLowerCase();
        const cleanUsername = normalizeUsername(identifier);

        const user = await User.findOne({
            $or: [
                { email: cleanIdentifier },
                { username: cleanUsername }
            ]
        }).select('email username displayName avatarUrl');

        if (!user) {
            return res.status(404).json({ message: 'No account found with that username or email.' });
        }

        res.status(200).json({
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
        });
    } catch (error) {
        console.error('Error in lookupUser:', error);
        res.status(500).json({ message: 'Internal server error during user lookup' });
    }
};
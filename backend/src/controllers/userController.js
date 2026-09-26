import User from '../models/User.js';

export const syncUser = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub; 
    
    const { email, displayName, avatarUrl, techDiscipline } = req.body;

    let user = await User.findOne({ auth0Id });
    
    if (!user) {
      user = await User.create({ auth0Id, email, displayName, avatarUrl, techDiscipline });
    } else {
      // Only update email unconditionally
      user.email = email;
      // Do not overwrite user's custom avatar or display name if they already exist
      if (!user.avatarUrl) user.avatarUrl = avatarUrl;
      if (!user.displayName) user.displayName = displayName;
      if (techDiscipline && !user.techDiscipline) user.techDiscipline = techDiscipline;
      await user.save();
    }

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
        const { displayName, avatarUrl, about, techDiscipline, githubProfile, linkedinProfile, portfolioUrl, verificationProof, hasCompletedProfile } = req.body;

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

        const user = await User.findOneAndUpdate(
            { auth0Id },
            { $set: updateData },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error updating profile' });
    }
};
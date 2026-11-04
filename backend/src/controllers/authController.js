import User from '../models/User.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/nativeAuth.js';
import { normalizeUsername } from '../utils/username.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signup = async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email address is required.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        if (!password || typeof password !== 'string') {
            return res.status(400).json({ message: 'Password is required.' });
        }
        if (password.length < 7) {
            return res.status(400).json({ message: 'Password must be at least 7 characters long.' });
        }
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one lowercase letter.' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one number.' });
        }

        // Check if email is already registered
        const existing = await User.findOne({ email: cleanEmail }).select('+passwordHash +passwordSalt');
        if (existing) {
            if (existing.passwordHash) {
                return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
            }
            // User signed in via Google/GitHub previously — set password for native access
            const { hash, salt } = hashPassword(password);
            existing.passwordHash = hash;
            existing.passwordSalt = salt;
            await existing.save();

            const token = generateToken({
                sub: existing.auth0Id,
                email: existing.email,
                displayName: existing.displayName,
                username: existing.username
            });

            const userObj = existing.toObject();
            delete userObj.passwordHash;
            delete userObj.passwordSalt;

            return res.status(200).json({
                success: true,
                token,
                user: userObj
            });
        }

        const { hash, salt } = hashPassword(password);
        const fallbackName = displayName?.trim() || cleanEmail.split('@')[0];

        // Create new native user
        const tempAuth0Id = `devsup|${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newUser = await User.create({
            email: cleanEmail,
            displayName: fallbackName,
            passwordHash: hash,
            passwordSalt: salt,
            auth0Id: tempAuth0Id,
            techDiscipline: 'Fullstack',
            hasCompletedProfile: false
        });

        // Ensure canonical auth0Id uses permanent Mongo _id
        newUser.auth0Id = `devsup|${newUser._id}`;
        await newUser.save();

        const token = generateToken({
            sub: newUser.auth0Id,
            email: newUser.email,
            displayName: newUser.displayName,
            username: newUser.username
        });

        const userObj = newUser.toObject();
        delete userObj.passwordHash;
        delete userObj.passwordSalt;

        return res.status(201).json({
            success: true,
            token,
            user: userObj
        });
    } catch (error) {
        console.error('Error during native signup:', error);
        return res.status(500).json({ message: error.message || 'Internal server error during registration.' });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || typeof identifier !== 'string') {
            return res.status(400).json({ message: 'Email or username is required.' });
        }
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ message: 'Password is required.' });
        }

        const cleanRaw = identifier.trim().toLowerCase();
        const cleanUser = normalizeUsername(identifier);

        // Find user by email or by username
        const user = await User.findOne({
            $or: [
                { email: cleanRaw },
                { username: cleanUser }
            ]
        }).select('+passwordHash +passwordSalt');

        if (!user || !user.passwordHash || !user.passwordSalt) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }

        const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }

        const token = generateToken({
            sub: user.auth0Id,
            email: user.email,
            displayName: user.displayName,
            username: user.username
        });

        const userObj = user.toObject();
        delete userObj.passwordHash;
        delete userObj.passwordSalt;

        return res.status(200).json({
            success: true,
            token,
            user: userObj
        });
    } catch (error) {
        console.error('Error during native login:', error);
        return res.status(500).json({ message: 'Internal server error during login.' });
    }
};

export const getMe = async (req, res) => {
    try {
        const auth0Id = req.auth?.payload?.sub;
        if (!auth0Id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await User.findOne({ auth0Id }).populate('blockedUsers', '_id displayName username avatarUrl techDiscipline about');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

import crypto from 'crypto';
import User from '../models/User.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/nativeAuth.js';
import { normalizeUsername } from '../utils/username.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

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
            avatarUrl: '/default-avatar.svg',
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

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email address is required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        const user = await User.findOne({ email: cleanEmail }).select('+passwordResetToken +passwordResetExpiry');
        if (!user) {
            // Return success anyway to avoid account enumeration
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        // Generate unhashed reset token to email to the user
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Store hashed token in DB
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-tjte.vercel.app';
        const cleanFrontendUrl = frontendUrl.replace(/\/+$/, '');
        const resetUrl = `${cleanFrontendUrl}/reset-password?token=${resetToken}`;

        const emailResult = await sendPasswordResetEmail({
            toEmail: user.email,
            displayName: user.displayName,
            resetUrl
        });

        return res.status(200).json({
            success: true,
            message: 'A password reset link has been sent to your email address.',
            // Return resetUrl only if email couldn't be sent via SMTP so users aren't locked out during dev/testing
            ...(emailResult.sent ? {} : { resetUrl, note: 'Email SMTP not configured on server; reset link provided directly.' })
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(500).json({ message: 'Internal server error processing password reset.' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ message: 'Reset token is required.' });
        }
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ message: 'New password is required.' });
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

        const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpiry: { $gt: new Date() }
        }).select('+passwordHash +passwordSalt +passwordResetToken +passwordResetExpiry');

        if (!user) {
            return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });
        }

        const { hash, salt } = hashPassword(password);
        user.passwordHash = hash;
        user.passwordSalt = salt;
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Your password has been successfully reset. You can now log in.'
        });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({ message: 'Internal server error while resetting password.' });
    }
};


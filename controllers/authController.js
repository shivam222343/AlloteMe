const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// JWT Secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Register new user
 * POST /api/auth/register
 * Body: { name, email, mobile, password }
 */
exports.register = async (req, res) => {
    try {
        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, mobile, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Mobile number already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name,
            email,
            mobile,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, tokenVersion: user.tokenVersion },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return user data (exclude password)
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                profilePic: user.profilePic,
                savedCollegeIds: user.savedCollegeIds
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, tokenVersion: user.tokenVersion },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return user data (exclude password)
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                profilePic: user.profilePic,
                savedCollegeIds: user.savedCollegeIds
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

/**
 * Get user profile
 * GET /api/user/profile
 * Protected route - requires JWT token
 */
exports.getProfile = async (req, res) => {
    try {
        // User is already attached to req by auth middleware
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                profilePic: user.profilePic,
                savedCollegeIds: user.savedCollegeIds,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
};

/**
 * Update user profile
 * PUT /api/user/profile
 * Protected route - requires JWT token
 * Body: { name?, mobile?, profilePic? }
 */
exports.updateProfile = async (req, res) => {
    try {
        const { name, mobile, profilePic } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (mobile) {
            // Check if mobile is already used by another user
            const existingUser = await User.findOne({ mobile, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Mobile number already in use' });
            }
            user.mobile = mobile;
        }
        if (profilePic) user.profilePic = profilePic;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                profilePic: user.profilePic,
                savedCollegeIds: user.savedCollegeIds
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
};

/**
 * Logout user (increment tokenVersion to invalidate all existing tokens)
 * POST /api/auth/logout
 * Protected route
 */
exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (user) {
            user.tokenVersion += 1;
            await user.save();
        }

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error during logout' });
    }
};

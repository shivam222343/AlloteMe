const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;

        // Validate phone number (Indian format - 10 digits)
        if (phoneNumber && !/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: 'User already exists' });

        user = new User({ name, email, password, phoneNumber: phoneNumber || '' });
        await user.save();

        res.json({ success: true, message: 'User registered successfully', userId: user._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profilePic: user.profilePic,
                savedColleges: user.savedColleges
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
    try {
        const { name, phoneNumber, profilePic } = req.body;

        // Validate phone number if provided
        if (phoneNumber && !/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (profilePic !== undefined) updateData.profilePic = profilePic;

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

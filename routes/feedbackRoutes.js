const express = require('express');
const router = express.Router();

// Feedback schema (simple in-memory for now, you can add MongoDB model later)
const feedbacks = [];

/**
 * POST /api/feedback
 * Submit user feedback
 */
router.post('/', async (req, res) => {
    try {
        const { type, message, userEmail, timestamp } = req.body;

        // Validation
        if (!type || !message) {
            return res.status(400).json({
                success: false,
                message: 'Type and message are required'
            });
        }

        // Create feedback object
        const feedback = {
            id: Date.now().toString(),
            type,
            message,
            userEmail: userEmail || 'anonymous',
            timestamp: timestamp || Date.now(),
            status: 'pending',
            createdAt: new Date()
        };

        // Store feedback (in-memory for now)
        feedbacks.push(feedback);

        console.log('Feedback received:', feedback);

        // TODO: Send email notification to admin
        // TODO: Store in MongoDB

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });

    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting feedback',
            error: error.message
        });
    }
});

/**
 * GET /api/feedback
 * Get all feedbacks (admin only - you can add auth middleware)
 */
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            count: feedbacks.length,
            data: feedbacks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

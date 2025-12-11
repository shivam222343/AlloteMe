const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// In-memory storage (replace with MongoDB model later)
let feedbacks = [];
let feedbackIdCounter = 1;

/**
 * POST /api/feedback
 * Submit new feedback with rating
 */
router.post('/', async (req, res) => {
    try {
        const { rating, message, userEmail } = req.body;

        // Validation
        if (!rating || !message || !userEmail) {
            return res.status(400).json({
                success: false,
                message: 'Rating, message, and email are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const feedback = new Feedback({
            rating: parseInt(rating),
            message,
            userEmail,
            status: 'pending',
            isVisible: false
        });

        await feedback.save();

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully. Awaiting admin approval.',
            data: feedback
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback'
        });
    }
});

/**
 * GET /api/feedback/approved
 * Get approved and visible feedbacks for home screen display
 */
router.get('/approved', async (req, res) => {
    try {
        const approvedFeedbacks = await Feedback.find({
            status: 'approved',
            isVisible: true
        })
            .sort({ approvedAt: -1 })
            .limit(10);

        res.json({
            success: true,
            count: approvedFeedbacks.length,
            data: approvedFeedbacks
        });
    } catch (error) {
        console.error('Error fetching approved feedbacks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedbacks'
        });
    }
});

/**
 * GET /api/feedback/all
 * Get all feedbacks (admin only)
 */
router.get('/all', async (req, res) => {
    try {
        const allFeedbacks = await Feedback.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: allFeedbacks.length,
            data: allFeedbacks
        });
    } catch (error) {
        console.error('Error fetching all feedbacks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedbacks'
        });
    }
});

/**
 * PUT /api/feedback/:id/approve
 * Approve a feedback (admin only)
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                isVisible: true,
                approvedAt: new Date()
            },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Feedback approved',
            data: feedback
        });
    } catch (error) {
        console.error('Error approving feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve feedback'
        });
    }
});

/**
 * PUT /api/feedback/:id/reject
 * Reject a feedback (admin only)
 */
router.put('/:id/reject', async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                isVisible: false
            },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Feedback rejected',
            data: feedback
        });
    } catch (error) {
        console.error('Error rejecting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject feedback'
        });
    }
});

/**
 * DELETE /api/feedback/:id
 * Delete a feedback (admin only)
 */
router.delete('/:id', async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Feedback deleted'
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback'
        });
    }
});

module.exports = router;

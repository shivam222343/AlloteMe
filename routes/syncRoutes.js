const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Cutoff = require('../models/Cutoff');

// Sync Colleges (fetch updated colleges since lastSync)
router.get('/colleges', async (req, res) => {
    try {
        const { lastSync } = req.query;
        const query = lastSync ? { updatedAt: { $gt: new Date(parseInt(lastSync)) } } : {};

        const colleges = await College.find(query).select('-__v').lean();

        res.json({
            success: true,
            data: colleges,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sync Cutoffs (fetch updated cutoffs since lastSync)
router.get('/cutoffs', async (req, res) => {
    try {
        const { lastSync } = req.query;
        const query = lastSync ? { updatedAt: { $gt: new Date(parseInt(lastSync)) } } : {};

        const cutoffs = await Cutoff.find(query)
            .populate('collegeId', 'name')
            .select('-__v')
            .lean();

        res.json({
            success: true,
            data: cutoffs,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

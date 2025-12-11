const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Cutoff = require('../models/Cutoff');

// Sync Colleges (fetch updated colleges since lastSync)
router.get('/colleges', async (req, res) => {
    try {
        const { lastSync } = req.query;
        const query = lastSync ? { updatedAt: { $gt: new Date(parseInt(lastSync)) } } : {};

        console.log(`[SYNC] Fetching colleges - lastSync: ${lastSync || 'none'}`);

        const colleges = await College.find(query).select('-__v').lean();

        console.log(`[SYNC] Found ${colleges.length} colleges to sync`);

        res.json({
            success: true,
            data: colleges,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('[SYNC] Error fetching colleges:', error);
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

// GET /api/sync/cutoffs/count - Get total count of cutoffs
router.get('/cutoffs/count', async (req, res) => {
    try {
        const count = await Cutoff.countDocuments();
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

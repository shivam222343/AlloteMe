const express = require('express');
const router = express.Router();
const Cutoff = require('../models/Cutoff');
const College = require('../models/College');

// Get categories metadata
router.get('/meta/categories', (req, res) => {
    const { exam } = req.query;

    // Pre-defined MHTCET Structure
    if (exam === 'MHTCET') {
        return res.json({
            success: true,
            data: {
                categories: ['OPEN', 'OBC', 'SC', 'ST', 'VJNT', 'NT1', 'NT2', 'NT3', 'EWS', 'TFWS', 'PWD'],
                subCategories: ['General', 'Male', 'Female', 'Home State', 'Other State', 'Minority'],
                seatTypes: ['AI', 'HS', 'OS', 'TFWS', 'DEF', 'PWD', 'GOI']
            }
        });
    }

    // Default or other exams
    res.json({
        success: true,
        data: {
            categories: ['OPEN', 'OBC', 'SC', 'ST', 'EWS'],
            subCategories: ['General', 'Female'],
            seatTypes: ['AI', 'State']
        }
    });
});

// Get branches metadata for a college (Auto-detected from existing cutoffs)
router.get('/meta/branches', async (req, res) => {
    try {
        const { collegeId } = req.query;
        if (!collegeId) return res.status(400).json({ success: false, message: 'collegeId required' });

        // Get distinct branches existing in cutoffs for this college
        const branches = await Cutoff.distinct('branch', { collegeId: collegeId });
        res.json({ success: true, data: branches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all cutoffs for a college
router.get('/college/:collegeId', async (req, res) => {
    try {
        const cutoffs = await Cutoff.find({ collegeId: req.params.collegeId })
            .sort({ year: -1, round: 1, branch: 1 });
        res.json({ success: true, data: cutoffs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add a new cutoff
router.post('/', async (req, res) => {
    try {
        const cutoff = new Cutoff(req.body);
        await cutoff.save();
        res.status(201).json({ success: true, data: cutoff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a cutoff
router.put('/:id', async (req, res) => {
    try {
        const cutoff = await Cutoff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cutoff) return res.status(404).json({ success: false, message: 'Cutoff not found' });
        res.json({ success: true, data: cutoff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a cutoff
router.delete('/:id', async (req, res) => {
    try {
        const cutoff = await Cutoff.findByIdAndDelete(req.params.id);
        if (!cutoff) return res.status(404).json({ success: false, message: 'Cutoff not found' });
        res.json({ success: true, message: 'Cutoff deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

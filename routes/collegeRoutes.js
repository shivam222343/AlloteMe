const express = require('express');
const router = express.Router();
const College = require('../models/College');

// Get all colleges (Public)
router.get('/', async (req, res) => {
    try {
        const colleges = await College.find().sort({ name: 1 });
        res.json({ success: true, data: colleges });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single college
router.get('/:id', async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) return res.status(404).json({ success: false, message: 'College not found' });
        res.json({ success: true, data: college });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Post college (Public/Protected if needed, but keeping simple for now)
router.post('/', async (req, res) => {
    try {
        const college = new College(req.body);
        await college.save();
        res.status(201).json({ success: true, data: college });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update college
router.put('/:id', async (req, res) => {
    try {
        const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!college) return res.status(404).json({ success: false, message: 'College not found' });
        res.json({ success: true, data: college });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete college
router.delete('/:id', async (req, res) => {
    try {
        const college = await College.findByIdAndDelete(req.params.id);
        if (!college) return res.status(404).json({ success: false, message: 'College not found' });
        res.json({ success: true, message: 'College deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

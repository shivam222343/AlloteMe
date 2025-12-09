const express = require('express');
const router = express.Router();
const HomeBanner = require('../models/HomeBanner');

// Get all active banners
router.get('/', async (req, res) => {
    try {
        const banners = await HomeBanner.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a banner
router.post('/', async (req, res) => {
    try {
        const banner = new HomeBanner(req.body);
        await banner.save();
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a banner
router.put('/:id', async (req, res) => {
    try {
        const banner = await HomeBanner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a banner
router.delete('/:id', async (req, res) => {
    try {
        await HomeBanner.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

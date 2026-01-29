const express = require('express');
const router = express.Router();
const PrebuiltQuery = require('../models/PrebuiltQuery');

// Get all prebuilt queries (for app and admin)
router.get('/', async (req, res) => {
    try {
        const queries = await PrebuiltQuery.find().sort({ order: 1 });
        res.json({ success: true, data: queries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new query (Admin)
router.post('/', async (req, res) => {
    try {
        const { text, order } = req.body;
        const newQuery = new PrebuiltQuery({ text, order });
        await newQuery.save();
        res.status(201).json({ success: true, data: newQuery });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Update query (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { text, order, isActive } = req.body;
        const updated = await PrebuiltQuery.findByIdAndUpdate(
            req.params.id,
            { text, order, isActive },
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete query (Admin)
router.delete('/:id', async (req, res) => {
    try {
        await PrebuiltQuery.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Query deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;

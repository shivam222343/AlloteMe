const express = require('express');
const router = express.Router();
const AIKnowledge = require('../models/AIKnowledge');

// Get all AI knowledge items
router.get('/', async (req, res) => {
    try {
        const knowledge = await AIKnowledge.find().sort({ createdAt: -1 });
        res.json({ success: true, data: knowledge });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new AI knowledge item
router.post('/', async (req, res) => {
    try {
        const { question, answer, category, tags } = req.body;
        const newItem = new AIKnowledge({
            question,
            answer,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });
        await newItem.save();
        res.json({ success: true, data: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update AI knowledge item
router.put('/:id', async (req, res) => {
    try {
        const { question, answer, category, tags } = req.body;
        const updatedItem = await AIKnowledge.findByIdAndUpdate(
            req.params.id,
            {
                question,
                answer,
                category,
                tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : []
            },
            { new: true }
        );
        res.json({ success: true, data: updatedItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete AI knowledge item
router.delete('/:id', async (req, res) => {
    try {
        await AIKnowledge.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

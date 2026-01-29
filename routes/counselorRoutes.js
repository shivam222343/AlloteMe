const express = require('express');
const router = express.Router();
const Counselor = require('../models/Counselor');
const CounselorRequest = require('../models/CounselorRequest');
const crypto = require('crypto');

// --- ADMIN ROUTES ---

// Get all counselors
router.get('/admin/list', async (req, res) => {
    try {
        const counselors = await Counselor.find().sort({ createdAt: -1 });
        res.json({ success: true, counselors });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Add new counselor
router.post('/admin/add', async (req, res) => {
    try {
        const { name, email, phone, regions, expertise, charges } = req.body;

        // Generate a random 8-character access key
        const accessKey = crypto.randomBytes(4).toString('hex').toUpperCase();

        const counselor = new Counselor({
            name, email, phone, regions, expertise, charges, accessKey
        });

        await counselor.save();
        res.status(201).json({ success: true, counselor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete counselor
router.delete('/admin/:id', async (req, res) => {
    try {
        await Counselor.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Counselor deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- COUNSELOR PORTAL ROUTES ---

// Login via Access Key
router.post('/login', async (req, res) => {
    try {
        const { accessKey } = req.body;
        const counselor = await Counselor.findOne({ accessKey, isAvailable: true });

        if (!counselor) {
            return res.status(401).json({ success: false, message: 'Invalid or inactive access key' });
        }

        res.json({ success: true, counselor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get requests for a specific counselor
router.get('/requests/:counselorId', async (req, res) => {
    try {
        const requests = await CounselorRequest.find({ counselorId: req.params.counselorId })
            .sort({ requestedAt: -1 });
        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update request status
router.patch('/request/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await CounselorRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- STUDENT FLOW ---

// Find counselor for a region
router.get('/find', async (req, res) => {
    try {
        const { region } = req.query;
        // Find a counselor who matches the region, or any available counselor if no match
        let counselor = await Counselor.findOne({ regions: { $in: [region] }, isAvailable: true });

        if (!counselor) {
            counselor = await Counselor.findOne({ isAvailable: true });
        }

        res.json({ success: true, counselor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Submit a connection request
router.post('/request', async (req, res) => {
    try {
        const request = new CounselorRequest(req.body);
        await request.save();
        res.status(201).json({ success: true, message: 'Request sent! Counselor will contact you soon.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

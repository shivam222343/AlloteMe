const express = require('express');
const router = express.Router();
const Counselor = require('../models/Counselor');
const CounselorRequest = require('../models/CounselorRequest');
const crypto = require('crypto');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'counselors',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
});

const upload = multer({ storage: storage });

// Document Storage for Student Requests
const docStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'counselor_docs',
        allowed_formats: ['pdf', 'jpg', 'png', 'jpeg']
    }
});
const uploadDoc = multer({ storage: docStorage });

// Upload student document (used by mobile app)
router.post('/upload-document', uploadDoc.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No document uploaded' });
        }
        res.json({ success: true, documentUrl: req.file.path });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- USER ROUTES ---

// Get requests by user ID
router.get('/user-requests/:userId', async (req, res) => {
    try {
        const requests = await CounselorRequest.find({ userId: req.params.userId })
            .populate('counselorId', 'name profileImage averageRating charges')
            .sort({ requestedAt: -1 });
        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

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

// Delete student request
router.delete('/request/:id', async (req, res) => {
    try {
        await CounselorRequest.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- STUDENT FLOW ---

// Find counselor for a region
router.get('/find', async (req, res) => {
    try {
        let { region } = req.query;
        if (!region || region === 'All Regions') {
            const counselor = await Counselor.findOne({ isAvailable: true });
            return res.json({ success: true, counselor });
        }

        // Clean region name (e.g. "Mumbai Region" -> "Mumbai")
        const baseRegion = region.replace(' Region', '').trim();

        // Find a counselor who matches the region using regex for fuzzy matching
        let counselor = await Counselor.findOne({
            regions: { $elemMatch: { $regex: new RegExp(baseRegion, 'i') } },
            isAvailable: true
        });

        // Fallback to any available counselor
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

        // Increment counselor's student count
        await Counselor.findByIdAndUpdate(req.body.counselorId, {
            $inc: { totalStudentsCounseled: 1 }
        });

        res.status(201).json({ success: true, message: 'Request sent! Counselor will contact you soon.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- PROFILE MANAGEMENT ROUTES ---

// Update counselor profile
router.put('/profile/:id', async (req, res) => {
    try {
        const { name, email, phone, bio, experience, qualification, regions, expertise, charges } = req.body;

        const counselor = await Counselor.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, bio, experience, qualification, regions, expertise, charges },
            { new: true }
        );

        res.json({ success: true, counselor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Upload profile image using multer
router.post('/profile-image/:id', (req, res, next) => {
    upload.single('profileImage')(req, res, (err) => {
        if (err) {
            console.error('Multer/Cloudinary Error:', err);
            return res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('Upload Request Received for:', req.params.id);
        if (!req.file) {
            console.warn('No file in request');
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        console.log('File uploaded successfully:', req.file.path);

        const counselor = await Counselor.findByIdAndUpdate(
            req.params.id,
            { profileImage: req.file.path },
            { new: true }
        );

        res.json({ success: true, counselor });
    } catch (err) {
        console.error('Database Update Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- RATING SYSTEM ROUTES ---

// Submit rating for a counselor
router.post('/request/:id/rating', async (req, res) => {
    try {
        const { rating, feedback } = req.body;

        const request = await CounselorRequest.findByIdAndUpdate(
            req.params.id,
            { rating, feedback, completedAt: new Date() },
            { new: true }
        );

        // Update counselor's average rating
        const counselorId = request.counselorId;
        const allRatings = await CounselorRequest.find({
            counselorId,
            rating: { $ne: null }
        });

        const totalRatings = allRatings.length;
        const sumRatings = allRatings.reduce((sum, req) => sum + req.rating, 0);
        const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        await Counselor.findByIdAndUpdate(counselorId, {
            totalRatings,
            averageRating
        });

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get all ratings for a counselor
router.get('/:id/ratings', async (req, res) => {
    try {
        const ratings = await CounselorRequest.find({
            counselorId: req.params.id,
            rating: { $ne: null }
        }).select('rating feedback studentInfo.name completedAt');

        res.json({ success: true, ratings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- ADMIN DETAIL ROUTES ---

// Get full counselor details with students
router.get('/admin/:id/details', async (req, res) => {
    try {
        const counselor = await Counselor.findById(req.params.id);
        const requests = await CounselorRequest.find({ counselorId: req.params.id })
            .sort({ requestedAt: -1 });

        res.json({ success: true, counselor, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get overall statistics
router.get('/admin/stats/overview', async (req, res) => {
    try {
        const totalCounselors = await Counselor.countDocuments();
        const activeCounselors = await Counselor.countDocuments({ isAvailable: true });
        const totalRequests = await CounselorRequest.countDocuments();
        const completedRequests = await CounselorRequest.countDocuments({ status: 'Completed' });

        const allCounselors = await Counselor.find();
        const avgRating = allCounselors.reduce((sum, c) => sum + c.averageRating, 0) / totalCounselors || 0;

        res.json({
            success: true,
            stats: {
                totalCounselors,
                activeCounselors,
                totalRequests,
                completedRequests,
                averageRating: avgRating.toFixed(2)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

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
        resource_type: 'auto'
    }
});
const uploadDoc = multer({ storage: docStorage });

// Upload student document (used by mobile app)
router.post('/upload-document', uploadDoc.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            console.warn('Document Upload: No file received');
            return res.status(400).json({ success: false, message: 'No document uploaded' });
        }

        console.log(`Document Uploaded: ${req.file.path} (Original: ${req.file.originalname})`);
        res.json({ success: true, documentUrl: req.file.path });
    } catch (err) {
        console.error('Document Upload Error:', err);
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

// Find counselors for a region
router.get('/find', async (req, res) => {
    try {
        let { region } = req.query;
        if (!region || region === 'All Regions') {
            const counselors = await Counselor.find({ isAvailable: true });
            return res.json({ success: true, counselors });
        }

        // Clean region name (e.g. "Mumbai Region" -> "Mumbai")
        const baseRegion = region.replace(' Region', '').trim();

        // Find counselors who match the region using regex for fuzzy matching
        let counselors = await Counselor.find({
            regions: { $elemMatch: { $regex: new RegExp(baseRegion, 'i') } },
            isAvailable: true
        });

        // Fallback to any available counselor if none found in region
        if (counselors.length === 0) {
            counselors = await Counselor.find({ isAvailable: true });
        }

        res.json({ success: true, counselors });
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

// --- NEARBY COUNSELORS ROUTES ---

// Get nearby counselors based on user location
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, maxDistance = 50 } = req.query; // maxDistance in km, default 50km

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDistanceMeters = parseFloat(maxDistance) * 1000; // Convert km to meters

        // Find counselors near the location using MongoDB geospatial query
        const counselors = await Counselor.find({
            locationEnabled: true,
            isAvailable: true,
            'location.coordinates': { $ne: null },
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude] // [lng, lat] format for GeoJSON
                    },
                    $maxDistance: maxDistanceMeters
                }
            }
        }).limit(50); // Limit to 50 nearest counselors

        // Calculate distance for each counselor
        const counselorsWithDistance = counselors.map(counselor => {
            const counselorLng = counselor.location.coordinates[0];
            const counselorLat = counselor.location.coordinates[1];

            // Haversine formula to calculate distance
            const R = 6371; // Earth's radius in km
            const dLat = (counselorLat - latitude) * Math.PI / 180;
            const dLng = (counselorLng - longitude) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(latitude * Math.PI / 180) * Math.cos(counselorLat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return {
                ...counselor.toObject(),
                distance: parseFloat(distance.toFixed(2)) // Distance in km
            };
        });

        res.json({
            success: true,
            counselors: counselorsWithDistance,
            count: counselorsWithDistance.length
        });
    } catch (err) {
        console.error('Nearby counselors error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get all counselors with location enabled (for map display)
router.get('/map-data', async (req, res) => {
    try {
        const counselors = await Counselor.find({
            locationEnabled: true,
            isAvailable: true,
            'location.coordinates': { $ne: null }
        }).select('name profileImage averageRating totalRatings charges address city state location phone regions expertise');

        res.json({
            success: true,
            counselors,
            count: counselors.length
        });
    } catch (err) {
        console.error('Map data error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update counselor location (for counselor dashboard)
router.put('/location/:id', async (req, res) => {
    try {
        const { address, city, state, pincode, latitude, longitude, locationEnabled } = req.body;

        const updateData = {
            address,
            city,
            state,
            pincode,
            locationEnabled: locationEnabled !== undefined ? locationEnabled : false
        };

        // Only update coordinates if both lat and lng are provided
        if (latitude !== undefined && longitude !== undefined) {
            updateData.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }

        const counselor = await Counselor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!counselor) {
            return res.status(404).json({ success: false, message: 'Counselor not found' });
        }

        res.json({ success: true, counselor });
    } catch (err) {
        console.error('Location update error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

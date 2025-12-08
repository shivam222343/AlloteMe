const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Admin = require('../models/Admin');
const adminController = require('../controllers/adminController');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Config Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'getcounsel',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
});

const upload = multer({ storage: storage });

// ========== AUTH ROUTES ==========

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username, password });

        if (admin) {
            res.json({ success: true, token: 'admin-token-' + admin._id, user: { name: admin.username } });
        } else {
            // Fallback to hardcoded for demo safety net if DB is empty
            if (username === 'admin' && password === 'admin123') {
                res.json({ success: true, token: 'demo-token', user: { name: 'Admin Demo' } });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, key } = req.body;

        if (key !== 'Admin_AlloteMe') {
            return res.status(403).json({ success: false, message: 'Invalid Admin Key' });
        }

        const existing = await Admin.findOne({ username });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const newAdmin = new Admin({ username, password });
        await newAdmin.save();

        res.json({ success: true, message: 'Admin registered successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== COLLEGE ROUTES ==========

// Create College
router.post('/colleges', upload.single('image'), adminController.createCollege);

// Get Colleges (with pagination)
router.get('/colleges', adminController.getColleges);

// Get Single College (with cutoffs)
router.get('/colleges/:id', adminController.getCollegeById);

// Update College
router.patch('/colleges/:id', upload.single('image'), adminController.updateCollege);

// Delete College
router.delete('/colleges/:id', adminController.deleteCollege);

// ========== CUTOFF ROUTES ==========

// Add Cutoff to College
router.post('/colleges/:id/cutoffs', adminController.addCutoff);

// Get Cutoffs by College
router.get('/colleges/:id/cutoffs', adminController.getCutoffsByCollege);

// Update Cutoff
router.patch('/cutoffs/:cutoffId', adminController.updateCutoff);

// Delete Cutoff
router.delete('/cutoffs/:cutoffId', adminController.deleteCutoff);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');

// Configure multer for multiple files (max 5 images)
const upload = multer({ dest: 'uploads/' });

// Admin authentication routes
router.post('/login', adminController.login);
router.post('/register', adminController.register);

// College routes
router.get('/colleges', adminController.getAllColleges);
router.get('/colleges/:id', adminController.getCollege);
router.post('/colleges', upload.array('images', 5), adminController.addCollege);
router.patch('/colleges/:id', upload.array('images', 5), adminController.updateCollege);
router.delete('/colleges/:id', adminController.deleteCollege);

// Cutoff routes
router.get('/colleges/:id/cutoffs', adminController.getCollegeCutoffs);
router.post('/colleges/:id/cutoffs', adminController.addCutoff);

module.exports = router;

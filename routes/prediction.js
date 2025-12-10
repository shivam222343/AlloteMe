const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const predictionController = require('../controllers/predictionController');
const exportController = require('../controllers/exportController');

/**
 * @route   POST /api/ai/predict
 * @desc    Get college predictions based on marks and filters
 * @access  Protected
 */
router.post('/predict', authMiddleware, predictionController.predictColleges);

/**
 * @route   POST /api/export/predictions
 * @desc    Export predictions to PDF/CSV
 * @access  Protected
 */
router.post('/export/predictions', authMiddleware, exportController.exportPredictions);

module.exports = router;

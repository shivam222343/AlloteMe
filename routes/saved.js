const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const savedController = require('../controllers/savedController');

/**
 * @route   POST /api/user/saved
 * @desc    Save a college to user's list
 * @access  Protected
 */
router.post('/', authMiddleware, savedController.saveCollege);

/**
 * @route   DELETE /api/user/saved/:collegeId
 * @desc    Remove college from saved list
 * @access  Protected
 */
router.delete('/:collegeId', authMiddleware, savedController.unsaveCollege);

/**
 * @route   GET /api/user/saved
 * @desc    Get all saved colleges
 * @access  Protected
 */
router.get('/', authMiddleware, savedController.getSavedColleges);

module.exports = router;

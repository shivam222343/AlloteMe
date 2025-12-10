const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   GET /api/banners
 * @desc    Get all active banners
 * @access  Public
 */
router.get('/', bannerController.getBanners);

/**
 * @route   PUT /api/admin/banners/:id
 * @desc    Update banner overlay text
 * @access  Protected (admin)
 */
router.put('/:id', authMiddleware, bannerController.updateBannerText);

module.exports = router;

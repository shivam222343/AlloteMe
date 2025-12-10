const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be exactly 10 digits'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Protected
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Protected
 */
router.get('/profile', authMiddleware, authController.getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put('/profile', authMiddleware, [
    body('name').optional().trim().notEmpty(),
    body('mobile').optional().matches(/^\d{10}$/),
    body('profilePic').optional().isURL()
], authController.updateProfile);

module.exports = router;

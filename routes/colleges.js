const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

/**
 * @route   GET /api/colleges/meta
 * @desc    Get sync metadata
 * @access  Public
 */
router.get('/meta', collegeController.getSyncMeta);

/**
 * @route   GET /api/colleges/branches
 * @desc    Get all unique branches
 * @access  Public
 */
router.get('/branches', collegeController.getUniqueBranches);

/**
 * @route   GET /api/colleges/cities
 * @desc    Get all unique cities
 * @access  Public
 */
router.get('/cities', collegeController.getUniqueCities);

/**
 * @route   GET /api/colleges/:id
 * @desc    Get college by ID with cutoffs
 * @access  Public
 */
router.get('/:id', collegeController.getCollegeById);

/**
 * @route   GET /api/colleges
 * @desc    Get all colleges with filters
 * @access  Public
 */
router.get('/', collegeController.getAllColleges);

module.exports = router;

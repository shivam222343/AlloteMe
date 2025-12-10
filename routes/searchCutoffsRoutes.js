const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Cutoff = require('../models/Cutoff');

/**
 * POST /api/search-cutoffs
 * Search cutoffs with college details for add to predictions
 */
router.post('/', async (req, res) => {
    try {
        const {
            examType,
            year,
            round,
            category,
            seatType,
            search = '',
            limit = 100
        } = req.body;

        console.log('Search cutoffs request:', req.body);

        // Build cutoff query
        const cutoffQuery = {
            examType,
            year: parseInt(year),
            round: parseFloat(round),
            category,
            seatType
        };

        // Find matching cutoffs
        const cutoffs = await Cutoff.find(cutoffQuery)
            .limit(parseInt(limit))
            .lean();

        console.log(`Found ${cutoffs.length} cutoffs for criteria`);

        if (cutoffs.length === 0) {
            return res.json({
                success: true,
                count: 0,
                results: [],
                message: 'No cutoffs found for these criteria'
            });
        }

        // Get unique college IDs
        const collegeIds = [...new Set(cutoffs.map(c => c.collegeId))];

        // Fetch colleges
        let collegeQuery = { _id: { $in: collegeIds } };

        // Add search filter if provided
        if (search && search.length >= 2) {
            collegeQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const colleges = await College.find(collegeQuery).lean();

        console.log(`Found ${colleges.length} colleges after search filter`);

        // Create college map
        const collegeMap = {};
        colleges.forEach(college => {
            collegeMap[college._id.toString()] = college;
        });

        // Build results with full details
        const results = [];
        cutoffs.forEach(cutoff => {
            const college = collegeMap[cutoff.collegeId.toString()];
            if (!college) return;

            results.push({
                _id: `${cutoff._id}`,
                college: {
                    _id: college._id,
                    name: college.name,
                    instituteCode: college.instituteCode || college.code || 'N/A',
                    location: college.location,
                    university: college.university
                },
                branch: cutoff.branch,
                percentile: cutoff.percentile,
                openingRank: cutoff.openingRank,
                closingRank: cutoff.closingRank,
                year: cutoff.year,
                round: cutoff.round,
                category: cutoff.category,
                seatType: cutoff.seatType
            });
        });

        res.json({
            success: true,
            count: results.length,
            results
        });

    } catch (error) {
        console.error('Search cutoffs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching cutoffs',
            error: error.message
        });
    }
});

module.exports = router;

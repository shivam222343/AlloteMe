const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Cutoff = require('../models/Cutoff');

/**
 * POST /api/predict
 * College prediction based on user input
 */
router.post('/', async (req, res) => {
    try {
        console.log('=== PREDICTION REQUEST RECEIVED ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));

        const {
            examType,
            percentile,
            year,
            round,
            category,
            seatType,
            toleranceRange = 10,
            preferredBranches,
            preferredCities,
            collegeStatuses
        } = req.body;

        // Validation - check for null/undefined, not falsy (0 is valid!)
        if (!examType || percentile == null || year == null || round == null || !category || !seatType) {
            console.error('Validation failed - missing fields:', {
                examType: !!examType,
                percentile: percentile != null,
                year: year != null,
                round: round != null,
                category: !!category,
                seatType: !!seatType
            });
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Build MongoDB query
        const query = {
            examType,
            year: parseInt(year),
            round: parseInt(round),
            category,
            seatType
        };

        // Add percentile range filter
        const minPercentile = percentile - toleranceRange;
        const maxPercentile = percentile + toleranceRange;
        query.percentile = { $gte: minPercentile, $lte: maxPercentile };

        // Optional filters with fuzzy branch matching
        if (preferredBranches && preferredBranches.length > 0) {
            // Use $or with individual regex patterns for each branch
            const branchConditions = preferredBranches.map(branch => {
                // Escape special regex characters and create case-insensitive pattern
                const escapedBranch = branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return { branch: new RegExp(escapedBranch, 'i') };
            });

            query.$or = branchConditions;
        }

        console.log('Prediction Query:', JSON.stringify(query, null, 2));

        // Find matching cutoffs
        let cutoffs;
        try {
            cutoffs = await Cutoff.find(query)
                .limit(100) // Reasonable limit
                .lean();
            console.log(`Query executed successfully, found ${cutoffs.length} cutoffs`);
        } catch (queryError) {
            console.error('MongoDB query error:', queryError);
            return res.status(500).json({
                success: false,
                message: 'Database query failed',
                error: queryError.message
            });
        }

        console.log(`Found ${cutoffs.length} cutoffs matching criteria`);

        if (cutoffs.length === 0) {
            return res.json({
                success: true,
                count: 0,
                predictions: [],
                message: 'No colleges found matching your criteria. Try adjusting filters.'
            });
        }

        // Get college IDs
        const collegeIds = [...new Set(cutoffs.map(c => c.collegeId))];

        // Build college query
        const collegeQuery = { _id: { $in: collegeIds } };

        // Filter by cities if specified
        if (preferredCities && preferredCities.length > 0) {
            collegeQuery.city = { $in: preferredCities };
        }

        // Filter by college status if specified
        if (collegeStatuses && collegeStatuses.length > 0) {
            collegeQuery.collegeStatus = { $in: collegeStatuses };
        }

        // Fetch colleges
        const colleges = await College.find(collegeQuery).lean();

        console.log(`Found ${colleges.length} colleges after filtering`);

        // Create college map for quick lookup
        const collegeMap = {};
        colleges.forEach(college => {
            collegeMap[college._id.toString()] = college;
        });

        // Build predictions
        const predictions = [];
        cutoffs.forEach((cutoff, index) => {
            const college = collegeMap[cutoff.collegeId.toString()];
            if (!college) return; // Skip if college not found or filtered out

            // Calculate match score
            const percentileDiff = Math.abs(percentile - cutoff.percentile);
            let matchScore = 0;

            if (percentileDiff === 0) {
                matchScore = 100;
            } else if (percentileDiff <= toleranceRange) {
                matchScore = 100 - ((percentileDiff / toleranceRange) * 30);
            } else if (percentileDiff <= toleranceRange * 2) {
                matchScore = 70 - (((percentileDiff - toleranceRange) / toleranceRange) * 20);
            } else {
                matchScore = Math.max(0, 50 - (percentileDiff - (2 * toleranceRange)));
            }

            // Generate match reason
            const diff = percentile - cutoff.percentile;
            let matchReason;
            if (diff >= 5) {
                matchReason = `Good Chance - Above cutoff by ${diff.toFixed(1)}%`;
            } else if (diff >= 0) {
                matchReason = `Possible - Near cutoff (+${diff.toFixed(1)}%)`;
            } else if (diff >= -5) {
                matchReason = `Borderline - Slightly below cutoff (${diff.toFixed(1)}%)`;
            } else {
                matchReason = `Reach - Below cutoff (${diff.toFixed(1)}%)`;
            }

            predictions.push({
                serialNumber: predictions.length + 1,
                college: {
                    _id: college._id,
                    name: college.name,
                    instituteCode: college.code || 'N/A',
                    location: college.city || college.state || 'N/A',
                    university: college.university,
                    status: college.collegeStatus,
                    fees: college.fees,
                    rating: college.rating
                },
                cutoff: {
                    _id: cutoff._id,
                    branch: cutoff.branch,
                    percentile: cutoff.percentile,
                    openingRank: cutoff.openingRank,
                    closingRank: cutoff.closingRank,
                    year: cutoff.year,
                    round: cutoff.round,
                    category: cutoff.category,
                    seatType: cutoff.seatType
                },
                matchScore: Math.round(matchScore),
                matchReason
            });
        });

        // Sort by match score descending
        predictions.sort((a, b) => b.matchScore - a.matchScore);

        // Ensure serial numbers are sequential after sorting
        predictions.forEach((pred, index) => {
            pred.serialNumber = index + 1;
        });

        // If we have less than 2 results, try with relaxed filters
        if (predictions.length < 2) {
            console.log('Less than 2 results, trying relaxed query...');

            const relaxedQuery = {
                examType,
                category,
                percentile: { $gte: minPercentile - 10, $lte: maxPercentile + 10 }
            };

            const relaxedCutoffs = await Cutoff.find(relaxedQuery)
                .limit(50)
                .lean();

            // Process relaxed results similarly (simplified for brevity)
            // You can add similar processing here if needed
        }

        res.json({
            success: true,
            count: predictions.length,
            predictions,
            parameters: {
                examType,
                percentile,
                year,
                round,
                category,
                seatType,
                toleranceRange
            }
        });

    } catch (error) {
        console.error('=== PREDICTION ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Request body:', JSON.stringify(req.body, null, 2));

        res.status(500).json({
            success: false,
            message: 'Server error during prediction',
            error: error.message,
            errorType: error.name
        });
    }
});

module.exports = router;

const Cutoff = require('../models/Cutoff');
const College = require('../models/College');

/**
 * AI-powered college prediction
 * POST /api/ai/predict
 * Body: { examType, percentile, category, selectedBranches[], filters: { city, status, seatType }, percentileRange }
 */
exports.predictColleges = async (req, res) => {
    try {
        const { examType, percentile, category, selectedBranches = [], filters = {}, percentileRange = 10 } = req.body;

        if (!examType || !percentile || !category) {
            return res.status(400).json({
                success: false,
                message: 'examType, percentile, and category are required'
            });
        }

        // Build cutoff query
        const cutoffQuery = {
            examType,
            category,
            percentile: {
                $gte: percentile - percentileRange,
                $lte: percentile + percentileRange
            }
        };

        // Add branch filter if specified
        if (selectedBranches.length > 0) {
            cutoffQuery.branch = { $in: selectedBranches };
        }

        // Add seat type filter
        if (filters.seatType) {
            cutoffQuery.seatType = filters.seatType;
        }

        // Get matching cutoffs
        const cutoffs = await Cutoff.find(cutoffQuery)
            .populate('collegeId')
            .sort({ year: -1, percentile: 1 })
            .limit(500);

        // Filter by college filters (city, status)
        let predictions = cutoffs.filter(cutoff => {
            if (!cutoff.collegeId) return false;

            if (filters.city && cutoff.collegeId.city !== filters.city) return false;
            if (filters.status && cutoff.collegeId.status !== filters.status) return false;

            return true;
        });

        // Calculate match scores and rank
        predictions = predictions.map((cutoff, index) => {
            // Score based on percentile closeness and recent year
            const percentileDiff = Math.abs(cutoff.percentile - percentile);
            const yearWeight = (cutoff.year - 2020) / 5; // Recent years get higher weight
            const matchScore = 100 - (percentileDiff * 2) + (yearWeight * 10);

            return {
                rank: index + 1,
                collegeId: cutoff.collegeId._id,
                collegeName: cutoff.collegeId.name,
                collegeCode: cutoff.collegeId.code,
                city: cutoff.collegeId.city,
                status: cutoff.collegeId.status,
                branch: cutoff.branch,
                year: cutoff.year,
                round: cutoff.round,
                category: cutoff.category,
                seatType: cutoff.seatType,
                closingRank: cutoff.closingRank,
                closingPercentile: cutoff.percentile,
                matchScore: Math.max(0, Math.min(100, matchScore)).toFixed(2)
            };
        });

        // Sort by match score descending
        predictions.sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore));

        // Re-assign ranks after sorting
        predictions = predictions.map((pred, index) => ({
            ...pred,
            rank: index + 1
        }));

        res.status(200).json({
            success: true,
            count: predictions.length,
            predictions: predictions.slice(0, 100) // Limit to top 100
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ success: false, message: 'Server error during prediction' });
    }
};

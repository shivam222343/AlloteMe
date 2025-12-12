const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Cutoff = require('../models/Cutoff');

// ===== CONSTANTS (Based on actual database schema) =====

const VALID_CATEGORIES = [
    // General categories
    'OPEN', 'SC', 'ST', 'VJ', 'NT1', 'NT2', 'NT3', 'OBC', 'SEBC',
    // Ladies categories
    'OPEN-L', 'SC-L', 'ST-L', 'VJ-L', 'NT1-L', 'NT2-L', 'NT3-L', 'OBC-L', 'SEBC-L',
    // Special categories
    'PWD', 'DEF', 'DEF-OBC', 'DEF-SC', 'DEF-SEBC', 'TFWS', 'EWS'
];

const VALID_SEAT_TYPES = [
    // Home University - General
    'GOPENH', 'GSCH', 'GSTH', 'GVJH', 'GNT1H', 'GNT2H', 'GNT3H', 'GOBCH', 'GSEBCH',
    // Home University - Ladies
    'LOPENH', 'LSCH', 'LSTH', 'LVJH', 'LNT1H', 'LNT2H', 'LNT3H', 'LOBCH', 'LSEBCH',
    // Other University - General
    'GOPENO', 'GSCO', 'GSTO', 'GVJO', 'GNT1O', 'GNT2O', 'GNT3O', 'GOBCO', 'GSEBCO',
    // Other University - Ladies
    'LOPENO', 'LSCO', 'LSTO', 'LVJO', 'LNT1O', 'LNT2O', 'LNT3O', 'LOBCO', 'LSEBCO',
    // State Level
    'GOPENS', 'GSC', 'GST', 'GVJ', 'GNT1', 'GNT2', 'GNT3', 'GOBC', 'GSEBC',
    'LOPENS', 'LSC', 'LST', 'LVJ', 'LNT1', 'LNT2', 'LNT3', 'LOBC', 'LSEBC',
    // Special seats
    'PWDOPENH', 'PWDOPENO', 'PWD', 'DEFOPENS', 'DEFOBCS', 'DEFSCS', 'DEFSEBCS',
    'DEF1', 'DEF2', 'DEF3', 'TFWS', 'EWS', 'MI', 'MINORITY'
];

// Category mappings for fuzzy matching
const CATEGORY_MAPPINGS = {
    'OPEN': ['OPEN', 'OPEN-L'],
    'SC': ['SC', 'SC-L'],
    'ST': ['ST', 'ST-L'],
    'VJ': ['VJ', 'VJ-L'],
    'NT1': ['NT1', 'NT1-L'],
    'NT2': ['NT2', 'NT2-L'],
    'NT3': ['NT3', 'NT3-L'],
    'OBC': ['OBC', 'OBC-L', 'DEF-OBC'],
    'SEBC': ['SEBC', 'SEBC-L', 'DEF-SEBC'],
    'PWD': ['PWD'],
    'DEF': ['DEF', 'DEF-OBC', 'DEF-SC', 'DEF-SEBC'],
    'TFWS': ['TFWS'],
    'EWS': ['EWS'],
    'LADIES': ['OPEN-L', 'SC-L', 'ST-L', 'VJ-L', 'NT1-L', 'NT2-L', 'NT3-L', 'OBC-L', 'SEBC-L']
};

const SEAT_TYPE_MAPPINGS = {
    // General mappings
    'OPEN': ['GOPENH', 'GOPENO', 'GOPENS', 'LOPENH', 'LOPENO', 'LOPENS'],
    'SC': ['GSCH', 'GSCO', 'GSC', 'LSCH', 'LSCO', 'LSC'],
    'ST': ['GSTH', 'GSTO', 'GST', 'LSTH', 'LSTO', 'LST'],
    'VJ': ['GVJH', 'GVJO', 'GVJ', 'LVJH', 'LVJO', 'LVJ'],
    'NT1': ['GNT1H', 'GNT1O', 'GNT1', 'LNT1H', 'LNT1O', 'LNT1'],
    'NT2': ['GNT2H', 'GNT2O', 'GNT2', 'LNT2H', 'LNT2O', 'LNT2'],
    'NT3': ['GNT3H', 'GNT3O', 'GNT3', 'LNT3H', 'LNT3O', 'LNT3'],
    'OBC': ['GOBCH', 'GOBCO', 'GOBC', 'LOBCH', 'LOBCO', 'LOBC'],
    'SEBC': ['GSEBCH', 'GSEBCO', 'GSEBC', 'LSEBCH', 'LSEBCO', 'LSEBC'],
    // Home University
    'HOME': ['GOPENH', 'GSCH', 'GSTH', 'GVJH', 'GNT1H', 'GNT2H', 'GNT3H', 'GOBCH', 'GSEBCH',
        'LOPENH', 'LSCH', 'LSTH', 'LVJH', 'LNT1H', 'LNT2H', 'LNT3H', 'LOBCH', 'LSEBCH'],
    // Other University
    'OTHER': ['GOPENO', 'GSCO', 'GSTO', 'GVJO', 'GNT1O', 'GNT2O', 'GNT3O', 'GOBCO', 'GSEBCO',
        'LOPENO', 'LSCO', 'LSTO', 'LVJO', 'LNT1O', 'LNT2O', 'LNT3O', 'LOBCO', 'LSEBCO'],
    // State Level
    'STATE': ['GOPENS', 'GSC', 'GST', 'GVJ', 'GNT1', 'GNT2', 'GNT3', 'GOBC', 'GSEBC',
        'LOPENS', 'LSC', 'LST', 'LVJ', 'LNT1', 'LNT2', 'LNT3', 'LOBC', 'LSEBC'],
    // Special
    'PWD': ['PWDOPENH', 'PWDOPENO', 'PWD'],
    'DEF': ['DEFOPENS', 'DEFOBCS', 'DEFSCS', 'DEFSEBCS', 'DEF1', 'DEF2', 'DEF3'],
    'TFWS': ['TFWS'],
    'EWS': ['EWS'],
    'MI': ['MI', 'MINORITY']
};

// ===== HELPER FUNCTIONS =====

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Find longest common substring length
 */
function longestCommonSubstring(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    let maxLength = 0;

    for (let i = 0; i < len1; i++) {
        for (let j = 0; j < len2; j++) {
            let k = 0;
            while (i + k < len1 && j + k < len2 && str1[i + k] === str2[j + k]) {
                k++;
            }
            maxLength = Math.max(maxLength, k);
        }
    }

    return maxLength;
}

/**
 * Calculate similarity score between input and target (0-100)
 */
function calculateSimilarity(input, target) {
    const inputUpper = input.toUpperCase();
    const targetUpper = target.toUpperCase();

    // 1. Exact match = 100%
    if (inputUpper === targetUpper) return 100;

    // 2. Contains match = 80-90%
    if (targetUpper.includes(inputUpper)) return 85;
    if (inputUpper.includes(targetUpper)) return 80;

    // 3. Partial match (common substrings) = 60-75%
    const commonLength = longestCommonSubstring(inputUpper, targetUpper);
    const maxLength = Math.max(input.length, target.length);
    const partialScore = (commonLength / maxLength) * 75;

    // 4. Levenshtein distance = 50-70%
    const distance = levenshteinDistance(inputUpper, targetUpper);
    const distanceScore = Math.max(0, 70 - (distance * 10));

    return Math.max(partialScore, distanceScore);
}

/**
 * Get all matching categories based on fuzzy matching
 */
function getMatchingCategories(inputCategory, fuzzyThreshold = 60) {
    const matches = [];

    // Check direct mappings first
    const inputUpper = inputCategory.toUpperCase();
    if (CATEGORY_MAPPINGS[inputUpper]) {
        return CATEGORY_MAPPINGS[inputUpper];
    }

    // Fuzzy match against all valid categories
    for (const category of VALID_CATEGORIES) {
        const similarity = calculateSimilarity(inputCategory, category);
        if (similarity >= fuzzyThreshold) {
            matches.push({ category, similarity });
        }
    }

    // Sort by similarity and return categories
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.map(m => m.category);
}

/**
 * Get all matching seat types based on fuzzy matching
 */
function getMatchingSeatTypes(inputSeatType, fuzzyThreshold = 60) {
    const matches = [];

    // Check direct mappings first
    const inputUpper = inputSeatType.toUpperCase();
    if (SEAT_TYPE_MAPPINGS[inputUpper]) {
        return SEAT_TYPE_MAPPINGS[inputUpper];
    }

    // Fuzzy match against all valid seat types
    for (const seatType of VALID_SEAT_TYPES) {
        const similarity = calculateSimilarity(inputSeatType, seatType);
        if (similarity >= fuzzyThreshold) {
            matches.push({ seatType, similarity });
        }
    }

    // Sort by similarity and return seat types
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.map(m => m.seatType);
}

/**
 * POST /api/predict
 * College prediction based on user input with fuzzy matching
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
            collegeStatuses,
            fuzzyMatch = true // Enable fuzzy matching by default
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

        // Get matching categories and seat types using fuzzy matching
        const matchingCategories = fuzzyMatch
            ? getMatchingCategories(category, 60)
            : [category];

        const matchingSeatTypes = fuzzyMatch
            ? getMatchingSeatTypes(seatType, 60)
            : [seatType];

        console.log('Fuzzy matching enabled:', fuzzyMatch);
        console.log('Input category:', category, '→ Matching:', matchingCategories);
        console.log('Input seat type:', seatType, '→ Matching:', matchingSeatTypes);

        // Build MongoDB query with flexible matching
        const query = {
            examType,
            year: parseInt(year),
            round: parseInt(round)
        };

        // Use $in for multiple category/seat type matches
        if (matchingCategories.length > 0) {
            query.category = { $in: matchingCategories };
        }

        if (matchingSeatTypes.length > 0) {
            query.seatType = { $in: matchingSeatTypes };
        }

        // Add percentile range filter
        const minPercentile = percentile - toleranceRange;
        const maxPercentile = percentile + toleranceRange;
        query.percentile = { $gte: minPercentile, $lte: maxPercentile };

        // Optional filters with fuzzy branch matching
        if (preferredBranches && preferredBranches.length > 0) {
            const branchConditions = preferredBranches.map(branch => {
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
                .limit(200) // Increased limit for more results
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

        // Build predictions - each cutoff as separate item (not grouped)
        const predictions = [];

        cutoffs.forEach(cutoff => {
            const college = collegeMap[cutoff.collegeId.toString()];
            if (!college) return;

            // Calculate match score
            const diff = percentile - cutoff.percentile;
            let matchScore = 0;

            // If user's percentile is higher than cutoff, they have excellent chances
            if (diff >= 0) {
                matchScore = 100; // User is above or at cutoff - excellent chance!
            } else {
                // User is below cutoff - calculate based on how far below
                const percentileDiff = Math.abs(diff);

                if (percentileDiff <= toleranceRange) {
                    // Within tolerance - still good chances (70-99%)
                    matchScore = 100 - ((percentileDiff / toleranceRange) * 30);
                } else if (percentileDiff <= toleranceRange * 2) {
                    // Beyond tolerance but within 2x - moderate chances (50-69%)
                    matchScore = 70 - (((percentileDiff - toleranceRange) / toleranceRange) * 20);
                } else {
                    // Far below cutoff - low chances (0-49%)
                    matchScore = Math.max(0, 50 - (percentileDiff - (2 * toleranceRange)));
                }
            }

            // Generate match reason
            let matchReason;
            if (diff >= 5) {
                matchReason = `Excellent - Above cutoff by ${diff.toFixed(1)}%`;
            } else if (diff >= 0) {
                matchReason = `Good Chance - At or above cutoff (+${diff.toFixed(1)}%)`;
            } else if (diff >= -5) {
                matchReason = `Possible - Slightly below cutoff (${diff.toFixed(1)}%)`;
            } else if (diff >= -10) {
                matchReason = `Borderline - Below cutoff (${diff.toFixed(1)}%)`;
            } else {
                matchReason = `Reach - Well below cutoff (${diff.toFixed(1)}%)`;
            }

            // Add each cutoff as a separate prediction
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
                    seatType: cutoff.seatType,
                    matchScore: Math.round(matchScore),
                    matchReason
                },
                matchScore: Math.round(matchScore),
                matchReason
            });
        });

        // Sort by percentile descending (default sort)
        predictions.sort((a, b) => b.cutoff.percentile - a.cutoff.percentile);

        // Update serial numbers after sorting
        predictions.forEach((pred, index) => {
            pred.serialNumber = index + 1;
        });

        console.log(`Returning ${predictions.length} predictions`);

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
                toleranceRange,
                fuzzyMatch,
                matchingCategories,
                matchingSeatTypes
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

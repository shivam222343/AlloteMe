const College = require('../models/College');
const Cutoff = require('../models/Cutoff');

/**
 * Get all colleges with filters and pagination
 * GET /api/colleges
 * Query params: q, city, status, page, limit, offline
 */
exports.getAllColleges = async (req, res) => {
    try {
        const { q, city, status, page = 1, limit = 50, offline } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { code: { $regex: q, $options: 'i' } },
                { city: { $regex: q, $options: 'i' } }
            ];
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (status) {
            filter.status = status; // e.g., 'Government', 'Non-Government', 'Government Autonomous'
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Query
        const colleges = await College.find(filter)
            .select(offline === 'true' ? '-__v' : '-__v') // Return all fields for offline sync
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ name: 1 });

        const total = await College.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: colleges.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            colleges
        });

    } catch (error) {
        console.error('Get colleges error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching colleges' });
    }
};

/**
 * Get college details by ID
 * GET /api/colleges/:id
 */
exports.getCollegeById = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);

        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        // Get cutoffs summary for this college
        const cutoffs = await Cutoff.find({ collegeId: college._id })
            .select('examType year round branch category seatType percentile closingRank')
            .sort({ year: -1, round: 1 })
            .limit(100); // Limit to recent cutoffs

        res.status(200).json({
            success: true,
            college,
            cutoffs
        });

    } catch (error) {
        console.error('Get college by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching college details' });
    }
};

/**
 * Get sync metadata (for offline sync)
 * GET /api/colleges/meta
 */
exports.getSyncMeta = async (req, res) => {
    try {
        const totalColleges = await College.countDocuments({ isActive: true });
        const totalCutoffs = await Cutoff.countDocuments();
        const lastUpdated = await College.findOne().sort({ updatedAt: -1 }).select('updatedAt');

        res.status(200).json({
            success: true,
            totalColleges,
            totalCutoffs,
            lastSynced: lastUpdated ? lastUpdated.updatedAt : new Date()
        });

    } catch (error) {
        console.error('Get sync meta error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching metadata' });
    }
};

/**
 * Get unique branches from all colleges (for filter auto-detection)
 * GET /api/colleges/branches
 */
exports.getUniqueBranches = async (req, res) => {
    try {
        const branches = await College.distinct('courses');

        res.status(200).json({
            success: true,
            branches: branches.filter(b => b && b.trim() !== '').sort()
        });

    } catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching branches' });
    }
};

/**
 * Get unique cities from all colleges
 * GET /api/colleges/cities
 */
exports.getUniqueCities = async (req, res) => {
    try {
        const cities = await College.distinct('city');

        res.status(200).json({
            success: true,
            cities: cities.filter(c => c && c.trim() !== '').sort()
        });

    } catch (error) {
        console.error('Get cities error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching cities' });
    }
};

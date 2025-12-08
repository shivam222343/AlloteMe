const College = require('../models/College');
const Cutoff = require('../models/Cutoff');
const cloudinary = require('cloudinary').v2;

// Create College
exports.createCollege = async (req, res) => {
    try {
        const { name, university, state, city, address, description, fees, rating, courses, contactEmail, contactPhone, website, status, mapLink } = req.body;
        const imageUrl = req.file ? req.file.path : '';

        // Parse courses if sent as string
        let parsedCourses = [];
        if (typeof courses === 'string') {
            try {
                parsedCourses = JSON.parse(courses);
            } catch (e) {
                parsedCourses = courses.split(',').map(c => c.trim());
            }
        } else if (Array.isArray(courses)) {
            parsedCourses = courses;
        }

        const college = new College({
            name,
            university,
            state,
            city,
            address,
            description,
            fees: parseFloat(fees) || 0,
            rating: parseFloat(rating) || 0,
            image: imageUrl,
            courses: parsedCourses,
            contactEmail,
            contactPhone,
            website,
            status: status || 'Active',
            mapLink
        });

        await college.save();
        res.json({ success: true, data: college });
    } catch (error) {
        console.error('Create college error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Colleges (with pagination and search)
exports.getColleges = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};

        const colleges = await College.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await College.countDocuments(query);

        res.json({
            success: true,
            data: colleges,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single College
exports.getCollegeById = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        // Fetch associated cutoffs
        const cutoffs = await Cutoff.find({ collegeId: college._id }).sort({ year: -1, round: 1 });

        res.json({ success: true, data: { college, cutoffs } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update College
exports.updateCollege = async (req, res) => {
    try {
        const updates = { ...req.body };

        // Handle new image upload
        if (req.file) {
            updates.image = req.file.path;
        }

        // Parse courses if needed
        if (updates.courses && typeof updates.courses === 'string') {
            try {
                updates.courses = JSON.parse(updates.courses);
            } catch (e) {
                updates.courses = updates.courses.split(',').map(c => c.trim());
            }
        }

        const college = await College.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        res.json({ success: true, data: college });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete College
exports.deleteCollege = async (req, res) => {
    try {
        const college = await College.findByIdAndDelete(req.params.id);
        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        // Delete associated cutoffs
        await Cutoff.deleteMany({ collegeId: req.params.id });

        res.json({ success: true, message: 'College deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add Cutoff to College
exports.addCutoff = async (req, res) => {
    try {
        const { examType, year, round, branch, category, openingRank, closingRank, percentile, seatType } = req.body;

        const cutoff = new Cutoff({
            collegeId: req.params.id,
            examType,
            year: parseInt(year),
            round: parseInt(round),
            branch,
            category,
            openingRank: openingRank ? parseInt(openingRank) : null,
            closingRank: parseInt(closingRank),
            percentile: percentile ? parseFloat(percentile) : null,
            seatType: seatType || 'State'
        });

        await cutoff.save();
        res.json({ success: true, data: cutoff });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Duplicate cutoff entry' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Cutoffs by College
exports.getCutoffsByCollege = async (req, res) => {
    try {
        const cutoffs = await Cutoff.find({ collegeId: req.params.id }).sort({ year: -1, round: 1, branch: 1 });
        res.json({ success: true, data: cutoffs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Cutoff
exports.updateCutoff = async (req, res) => {
    try {
        const cutoff = await Cutoff.findByIdAndUpdate(req.params.cutoffId, req.body, { new: true });
        if (!cutoff) {
            return res.status(404).json({ success: false, message: 'Cutoff not found' });
        }
        res.json({ success: true, data: cutoff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Cutoff
exports.deleteCutoff = async (req, res) => {
    try {
        const cutoff = await Cutoff.findByIdAndDelete(req.params.cutoffId);
        if (!cutoff) {
            return res.status(404).json({ success: false, message: 'Cutoff not found' });
        }
        res.json({ success: true, message: 'Cutoff deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

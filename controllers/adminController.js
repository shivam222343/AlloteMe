const College = require('../models/College');
const Cutoff = require('../models/Cutoff');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Add College with multiple images
exports.addCollege = async (req, res) => {
    try {
        const collegeData = { ...req.body };

        // Parse courses if it's string
        if (typeof collegeData.courses === 'string') {
            collegeData.courses = JSON.parse(collegeData.courses);
        }

        // Upload multiple images to Cloudinary
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'colleges',
                    transformation: [
                        { width: 800, height: 600, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                imageUrls.push(result.secure_url);
            }
        }

        collegeData.images = imageUrls;

        const college = new College(collegeData);
        await college.save();

        res.json({ success: true, message: 'College added successfully', data: college });
    } catch (error) {
        console.error('Add college error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all colleges
exports.getAllColleges = async (req, res) => {
    try {
        const colleges = await College.find().sort({ createdAt: -1 });
        res.json({ success: true, data: colleges });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single college
exports.getCollege = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }
        res.json({ success: true, data: college });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update College
exports.updateCollege = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (typeof updateData.courses === 'string') {
            updateData.courses = JSON.parse(updateData.courses);
        }

        // Upload new images if provided
        if (req.files && req.files.length > 0) {
            const imageUrls = [];
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'colleges',
                    transformation: [
                        { width: 800, height: 600, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                imageUrls.push(result.secure_url);
            }
            updateData.images = imageUrls;
        }

        const college = await College.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        res.json({ success: true, message: 'College updated', data: college });
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

        // Delete images from Cloudinary
        if (college.images && college.images.length > 0) {
            for (const imageUrl of college.images) {
                try {
                    const publicId = imageUrl.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`colleges/${publicId}`);
                } catch (err) {
                    console.error('Error deleting image:', err);
                }
            }
        }

        res.json({ success: true, message: 'College deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get college cutoffs
exports.getCollegeCutoffs = async (req, res) => {
    try {
        const cutoffs = await Cutoff.find({ collegeId: req.params.id }).sort({ year: -1, round: 1 });
        res.json({ success: true, data: cutoffs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add cutoff
exports.addCutoff = async (req, res) => {
    try {
        const cutoffData = {
            ...req.body,
            collegeId: req.params.id
        };

        const cutoff = new Cutoff(cutoffData);
        await cutoff.save();

        res.json({ success: true, message: 'Cutoff added', data: cutoff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

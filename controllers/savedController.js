const User = require('../models/User');
const College = require('../models/College');

/**
 * Add college to saved list
 * POST /api/user/saved
 * Body: { collegeId }
 */
exports.saveCollege = async (req, res) => {
    try {
        const { collegeId } = req.body;

        if (!collegeId) {
            return res.status(400).json({ success: false, message: 'College ID is required' });
        }

        // Verify college exists
        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if already saved (idempotent operation)
        if (user.hasCollegeSaved(collegeId)) {
            return res.status(200).json({
                success: true,
                message: 'College already in saved list',
                savedCollegeIds: user.savedCollegeIds
            });
        }

        // Add to saved list
        user.savedCollegeIds.push(collegeId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'College saved successfully',
            savedCollegeIds: user.savedCollegeIds
        });

    } catch (error) {
        console.error('Save college error:', error);
        res.status(500).json({ success: false, message: 'Server error saving college' });
    }
};

/**
 * Remove college from saved list
 * DELETE /api/user/saved/:collegeId
 */
exports.unsaveCollege = async (req, res) => {
    try {
        const { collegeId } = req.params;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove from saved list
        user.savedCollegeIds = user.savedCollegeIds.filter(
            id => id.toString() !== collegeId
        );
        await user.save();

        res.status(200).json({
            success: true,
            message: 'College removed from saved list',
            savedCollegeIds: user.savedCollegeIds
        });

    } catch (error) {
        console.error('Unsave college error:', error);
        res.status(500).json({ success: false, message: 'Server error removing college' });
    }
};

/**
 * Get user's saved colleges (populated with full college data)
 * GET /api/user/saved
 */
exports.getSavedColleges = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate({
                path: 'savedCollegeIds',
                select: '-__v' // Exclude version field
            });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            count: user.savedCollegeIds.length,
            colleges: user.savedCollegeIds
        });

    } catch (error) {
        console.error('Get saved colleges error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching saved colleges' });
    }
};

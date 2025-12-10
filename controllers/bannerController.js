const HomeBanner = require('../models/HomeBanner');

/**
 * Get all active banners
 * GET /api/banners
 */
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true })
            .populate('linkedCollegeId', 'name code city images')
            .sort({ order: 1 })
            .select('-__v');

        res.status(200).json({
            success: true,
            count: banners.length,
            banners
        });

    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching banners' });
    }
};

/**
 * Update banner text (admin)
 * PUT /api/admin/banners/:id
 * Body: { overlayText }
 */
exports.updateBannerText = async (req, res) => {
    try {
        const { overlayText } = req.body;
        const { id } = req.params;

        const banner = await HomeBanner.findByIdAndUpdate(
            id,
            { overlayText },
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Banner text updated',
            banner
        });

    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({ success: false, message: 'Server error updating banner' });
    }
};

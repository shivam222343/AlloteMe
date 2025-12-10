const mongoose = require('mongoose');

const homeBannerSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true }, // Cloudinary URL
    targetUrl: { type: String }, // Optional deep link or external link
    title: { type: String },
    overlayText: { type: String, default: '' }, // Text to display at bottom of banner
    linkedCollegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' }, // Optional college reference for save button
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('HomeBanner', homeBannerSchema);

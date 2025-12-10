const mongoose = require('mongoose');

const homeBannerSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    targetUrl: { type: String }, // Optional deep link or external link
    title: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('HomeBanner', homeBannerSchema);

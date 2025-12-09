const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    collegeId: { type: Number, unique: true, sparse: true }, // Optional sync ID for Android
    name: { type: String, required: true },
    code: { type: String, default: '' }, // College Code (e.g., 6006)
    university: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
    fees: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    images: [{ type: String }], // Array of Cloudinary URLs
    courses: [{ type: String }], // Array of course names
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    website: { type: String, default: '' },
    collegeStatus: { type: String, default: 'Autonomous' }, // Autonomous, Government, etc.
    status: { type: String, default: 'Active' }, // Active/Inactive
    isFeatured: { type: Boolean, default: false }, // Featured on Home Screen
    mapLink: { type: String, default: '' } // Google Maps link
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);

const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    collegeId: { type: Number, unique: true, sparse: true }, // Optional sync ID for Android
    name: { type: String, required: true },
    university: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
    fees: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    image: { type: String, default: '' }, // Cloudinary URL
    courses: [{ type: String }], // Array of course names
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    website: { type: String, default: '' },
    status: { type: String, default: 'Active' }, // Active, Inactive, Autonomous
    mapLink: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);

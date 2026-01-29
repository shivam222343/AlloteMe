const mongoose = require('mongoose');

const CounselorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: String,
    photo: String, // URL/Path to photo
    regions: [String], // Regions they cover (Mumbai Region, Pune Region, etc.)
    expertise: [String], // Engineering, Pharmacy, etc.
    accessKey: {
        type: String,
        unique: true,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    charges: {
        type: String, // e.g., "Starting from ₹500"
        default: "Paid Support"
    },
    rating: {
        type: Number,
        default: 4.5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Counselor', CounselorSchema);

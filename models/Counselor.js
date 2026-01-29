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
    profileImage: {
        type: String, // URL to profile image
        default: null
    },
    bio: {
        type: String,
        default: "Experienced counselor helping students achieve their dreams"
    },
    experience: {
        type: String, // e.g., "5+ years"
        default: "3+ years"
    },
    qualification: {
        type: String, // e.g., "M.Ed, Career Counseling"
        default: "Certified Career Counselor"
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalStudentsCounseled: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Counselor', CounselorSchema);

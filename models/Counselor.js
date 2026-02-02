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
    // Location fields for nearby counselors feature
    address: {
        type: String,
        default: null
    },
    city: {
        type: String,
        default: null
    },
    state: {
        type: String,
        default: null
    },
    pincode: {
        type: String,
        default: null
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: null
        }
    },
    locationEnabled: {
        type: Boolean,
        default: false // Counselors must explicitly enable location sharing
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create geospatial index for location-based queries
CounselorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Counselor', CounselorSchema);

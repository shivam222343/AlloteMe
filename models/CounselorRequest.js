const mongoose = require('mongoose');

const CounselorRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    counselorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Counselor',
        required: true
    },
    studentInfo: {
        name: String,
        phone: String,
        email: String,
        percentile: Number,
        rank: Number
    },
    preferences: {
        examType: String,
        preferredBranches: [String],
        preferredRegions: [String],
        category: String,
        seatType: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'In-Progress', 'Completed'],
        default: 'Pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CounselorRequest', CounselorRequestSchema);

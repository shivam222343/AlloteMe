const mongoose = require('mongoose');

const cutoffSchema = new mongoose.Schema({
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    examType: { type: String, required: true, enum: ['MHTCET', 'JEE', 'NEET'] },
    year: { type: Number, required: true },
    round: { type: Number, required: true },
    branch: { type: String, required: true },

    // Category Details
    category: { type: String, required: true }, // OPEN, OBC, SC, ST, etc.
    subCategory: { type: String, default: 'General' }, // Male, Female, Home State, etc.
    casteGroup: { type: String }, // General, Reserved (Optional)

    // Seat Information
    seatType: { type: String, required: true }, // AI, HS, OS, TFWS, etc.

    // Cutoff Data
    percentile: { type: Number, required: true },
    openingRank: { type: Number },
    closingRank: { type: Number },

}, { timestamps: true });

// Compound index to ensure uniqueness of a specific cutoff entry
cutoffSchema.index({ collegeId: 1, examType: 1, year: 1, round: 1, branch: 1, category: 1, seatType: 1 }, { unique: true });

module.exports = mongoose.model('Cutoff', cutoffSchema);

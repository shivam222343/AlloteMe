const mongoose = require('mongoose');

const cutoffSchema = new mongoose.Schema({
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    examType: { type: String, required: true, enum: ['MHTCET', 'JEE', 'NEET'] },
    year: { type: Number, required: true, min: 2020 },
    round: { type: Number, required: true, min: 1, max: 5 },
    branch: { type: String, required: true },
    category: { type: String, required: true, enum: ['OPEN', 'OBC', 'SC', 'ST', 'EWS', 'NT'] },
    openingRank: { type: Number, default: null },
    closingRank: { type: Number, required: true },
    percentile: { type: Number, default: null },
    seatType: { type: String, enum: ['State', 'All India'], default: 'State' }
}, { timestamps: true });

// Compound index to prevent duplicate cutoffs
cutoffSchema.index({ collegeId: 1, examType: 1, year: 1, round: 1, branch: 1, category: 1, seatType: 1 }, { unique: true });

module.exports = mongoose.model('Cutoff', cutoffSchema);

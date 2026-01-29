const mongoose = require('mongoose');

const PrebuiltQuerySchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PrebuiltQuery', PrebuiltQuerySchema);

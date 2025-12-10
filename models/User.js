const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v); // Exactly 10 digits
            },
            message: props => `${props.value} is not a valid 10-digit mobile number!`
        }
    },
    password: { type: String, required: true }, // Store bcrypt hashed password
    profilePic: { type: String, default: '' },
    savedCollegeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'College' }], // References to College documents
    tokenVersion: { type: Number, default: 0 }, // For JWT invalidation on logout
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if college is saved
userSchema.methods.hasCollegeSaved = function (collegeId) {
    return this.savedCollegeIds.some(id => id.toString() === collegeId.toString());
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Store hashed in prod
    phoneNumber: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    savedColleges: [{ type: String }] // Array of College Names or IDs
});

module.exports = mongoose.model('User', userSchema);

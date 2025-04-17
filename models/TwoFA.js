const mongoose = require('mongoose');

const twoFASchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    code: { type: String }, 
    verified: { type: Boolean, default: false }
});

module.exports = mongoose.model('TwoFA', twoFASchema);
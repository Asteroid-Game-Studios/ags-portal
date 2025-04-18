const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    join_date: { type: Date, default: Date.now },
    last_login: { type: Date, default: Date.now },
    roles: { type: [String], default: [] } // Changed to array of strings
}, { collection: 'portal_users' });

module.exports = mongoose.model('Users', userSchema);
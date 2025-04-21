const mongoose = require('mongoose');

const TokenStoreSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    expiresAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

TokenStoreSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('TokenStore', TokenStoreSchema);
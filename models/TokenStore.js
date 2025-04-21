const mongoose = require('mongoose');

const TokenStoreSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        unique: true 
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

module.exports = mongoose.model('TokenStore', TokenStoreSchema);
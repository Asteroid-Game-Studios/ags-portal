const mongoose = require('mongoose');
const { fetchGuildMember, fetchUserConnections, hasStaffRole } = require('./discord');

const TokenStore = mongoose.model('TokenStore', new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date }
}));

async function storeAccessToken(userId, accessToken, refreshToken = null, expiresIn = 86400) {
    try {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        await TokenStore.findOneAndUpdate(
            { userId },
            {
                userId,
                accessToken,
                refreshToken,
                expiresAt
            },
            { upsert: true }
        );

        return true;
    } catch (error) {
        console.error('Error storing access token:', error);
        return false;
    }
}

async function retrieveAccessToken(userId) {
    try {
        const tokenData = await TokenStore.findOne({ userId });
        if (!tokenData) {
            return null;
        }

        if (tokenData.expiresAt && tokenData.expiresAt < new Date()) {
            return null;
        }

        return tokenData.accessToken;
    } catch (error) {
        console.error('Error retrieving access token:', error);
        return null;
    }
}

async function fetchUserProfile(userId, accessToken) {
    try {
        const guildMember = await fetchGuildMember(userId, accessToken);
        if (!guildMember || !hasStaffRole(guildMember)) {
            return null;
        }

        const connections = await fetchUserConnections(accessToken);

        const roles = [];
        if (guildMember.roles.includes(process.env.DIRECTOR_ROLE_ID)) {
            roles.push('Director');
        }
        if (guildMember.roles.includes(process.env.DEVELOPER_ROLE_ID)) {
            roles.push('Developer');
        }
        if (guildMember.roles.includes(process.env.SOUND_DESIGN_ROLE_ID)) {
            roles.push('Sound Design');
        }

        return {
            id: userId,
            username: guildMember.user.username,
            discriminator: guildMember.user.discriminator || '0',
            avatar: guildMember.user.avatar,
            bio: guildMember.user.bio || null,
            guildMember: guildMember,
            staffMember: true,
            connections: connections,
            roles: roles,
            accessToken: accessToken
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

async function clearUserSession(userId) {
    try {
        await TokenStore.deleteOne({ userId });
        return true;
    } catch (error) {
        console.error('Error clearing user session:', error);
        return false;
    }
}

module.exports = {
    storeAccessToken,
    retrieveAccessToken,
    fetchUserProfile,
    clearUserSession
};
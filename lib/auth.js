const mongoose = require('mongoose');
const { fetchGuildMember, fetchUserConnections, hasStaffRole } = require('./discord');

const TokenStore = mongoose.model('TokenStore', new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date }
}));

async function storeAccessToken(userId, accessToken, refreshToken = null, expiresIn = 86400, sessionId = null) {
    try {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        if (!sessionId) {
            sessionId = require('crypto').randomUUID();
        }

        console.log(`Storing token for user ${userId} with session ${sessionId}`);

        await TokenStore.findOneAndUpdate(
            { userId, sessionId },
            {
                userId,
                sessionId,
                accessToken,
                refreshToken,
                expiresAt
            },
            { upsert: true }
        );

        return { success: true, sessionId };
    } catch (error) {
        console.error('Error storing access token:', error);
        return { success: false };
    }
}

async function retrieveAccessToken(userId, sessionId = null) {
    try {
        const query = { userId };


        if (sessionId) {
            query.sessionId = sessionId;
        }


        const tokenData = sessionId
            ? await TokenStore.findOne(query)
            : await TokenStore.findOne(query).sort({ createdAt: -1 });

        if (!tokenData) {
            console.log(`No token found for user ${userId}${sessionId ? ' with session ' + sessionId : ''}`);
            return null;
        }

        if (tokenData.expiresAt && tokenData.expiresAt < new Date()) {
            console.log(`Token expired for user ${userId}`);
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

async function clearUserSession(userId, sessionId = null) {
    try {
        const query = { userId };

        if (sessionId) {
            query.sessionId = sessionId;
            console.log(`Clearing specific session ${sessionId} for user ${userId}`);
        } else {
            console.log(`Clearing all sessions for user ${userId}`);
        }

        await TokenStore.deleteMany(query);
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
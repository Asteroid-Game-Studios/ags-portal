const { sendDirectMessage } = require('./discord');
const crypto = require('crypto');
const TwoFA = require('../models/TwoFA');

function generateCode() {
    return crypto.randomInt(100000, 999999).toString();
}

async function send2FACode(userId, username) {
    try {
        const code = generateCode();

        await TwoFA.findOneAndUpdate(
            { userId },
            { code, verified: false },
            { upsert: true, new: true }
        );

        const embed = {
            color: 0x5865F2,
            title: 'Two-Factor Authentication Required',
            description: 'Welcome to the Asteroid Studios Staff Portal! To complete your first-time login, please enter the verification code below on the website.',
            fields: [
                {
                    name: 'Security Notice',
                    value: '-> This code is valid for 10 minutes\n-> Never share this code with anyone\n-> Staff members will never ask for this code',
                    inline: false
                },
                {
                    name: 'Your Verification Code',
                    value: `||${code}||`,
                    inline: false
                }
            ],
            timestamp: new Date(),
            footer: {
                text: 'Asteroid Game Studios Security'
            }
        };

        const result = await sendDirectMessage(userId, { embeds: [embed] });
        if (!result.success && result.error === 'DMS_CLOSED') {
            return { success: false, error: 'DMS_CLOSED' };
        }
        return { success: true };
    } catch (error) {
        console.error('Error sending 2FA code:', error);
        return { success: false, error: 'UNKNOWN' };
    }
}

async function set2FACode(userId, code) {
    await TwoFA.findOneAndUpdate(
        { userId },
        { code, verified: false },
        { upsert: true, new: true }
    );
}

async function verify2FACode(userId, code) {
    const entry = await TwoFA.findOne({ userId, code });
    if (entry) {
        entry.verified = true;
        await entry.save();
        return true;
    }
    return false;
}

async function is2FAVerified(userId) {
    const entry = await TwoFA.findOne({ userId });
    return !!(entry && entry.verified);
}

async function remove2FA(userId) {
    await TwoFA.deleteOne({ userId });
}

module.exports = {
    send2FACode,
    set2FACode,
    verify2FACode,
    is2FAVerified,
    remove2FA
};
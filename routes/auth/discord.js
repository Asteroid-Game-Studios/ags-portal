const express = require('express');
const passport = require('passport');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const {
    fetchGuildMember,
    fetchUserConnections,
    hasStaffRole,
    sendLoginNotification,
    logToChannel,
    fetchGuildInfo
} = require('../../lib/discord');
const {
    set2FACode,
    verify2FACode,
    is2FAVerified,
    remove2FA,
    send2FACode
} = require('../../lib/2fa');

router.get('/discord', passport.authenticate('discord', {
    scope: ['identify', 'guilds', 'connections']
}));


router.get('/callback/discord',
    passport.authenticate('discord', { failureRedirect: '/' }),
    async (req, res) => {
        try {
            const guildMember = await fetchGuildMember(req.user.id, req.user.accessToken);
            const connections = await fetchUserConnections(req.user.accessToken);
            const guildInfo = await fetchGuildInfo();

            if (guildMember && hasStaffRole(guildMember)) {
                const hasCompletedAuth = await is2FAVerified(req.user.id);

                if (!hasCompletedAuth) {

                    const userAvatar = req.user.avatar
                        ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png?size=256`
                        : 'https://cdn.discordapp.com/embed/avatars/0.png';


                    const guildIcon = guildInfo && guildInfo.icon
                        ? `https://cdn.discordapp.com/icons/${process.env.GUILD_ID}/${guildInfo.icon}.png?size=128`
                        : 'https://cdn.discordapp.com/embed/avatars/0.png';


                    await logToChannel({
                        embeds: [{
                            color: 0x5865F2,
                            title: 'Staff Portal Security Alert',
                            description: `A staff member requires 2FA verification for their first login.`,
                            thumbnail: {
                                url: userAvatar
                            },
                            fields: [
                                {
                                    name: 'User',
                                    value: `<@${req.user.id}>`,
                                    inline: true
                                },
                                {
                                    name: 'Timestamp',
                                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                                    inline: true
                                },
                                {
                                    name: 'Security Protocol',
                                    value: `-> 2FA code sent via Discord DM\n-> User redirected to verification page\n-> Access pending verification`,
                                    inline: false
                                }
                            ],
                            footer: {
                                text: 'Asteroid Studios Security System',
                                icon_url: guildIcon
                            },
                            timestamp: new Date().toISOString()
                        }]
                    });


                    const result = await send2FACode(req.user.id, req.user.username);
                    if (!result.success) {
                        if (result.error === 'DMS_CLOSED') {
                            return res.redirect('/dms-closed');
                        }
                        return res.redirect('/2fa-error');
                    }
                    return res.redirect('/2fa');
                }


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

                req.user.bio = guildMember.user.bio || null;
                req.user.guildMember = guildMember;
                req.user.staffMember = true;
                req.user.connections = connections;
                req.user.roles = roles;

                await sendLoginNotification(req.user);
                res.redirect('/dashboard');
            } else {
                req.logout((err) => {
                    if (err) console.error(err);
                    res.redirect('/?error=unauthorized');
                });
            }
        } catch (error) {
            console.error('Auth callback error:', error);
            res.redirect('/?error=server');
        }
    }
);

router.post('/verify-2fa', express.urlencoded({ extended: true }), async (req, res) => {
    const { code } = req.body;
    if (!code || !req.user) {
        return res.redirect('/2fa-error');
    }


    const isValid = await verify2FACode(req.user.id, code);
    if (isValid) {
        try {

            const guildMember = await fetchGuildMember(req.user.id, req.user.accessToken);
            const connections = await fetchUserConnections(req.user.accessToken);

            if (guildMember && hasStaffRole(guildMember)) {

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

                req.user.bio = guildMember.user.bio || null;
                req.user.guildMember = guildMember;
                req.user.staffMember = true;
                req.user.connections = connections;
                req.user.roles = roles;


                await sendLoginNotification(req.user);
                return res.redirect('/dashboard');
            }
        } catch (error) {
            console.error('Error during 2FA verification:', error);
        }
        return res.redirect('/?error=unauthorized');
    } else {
        res.redirect('/2fa?error=invalid');
    }
});

router.get('/retry-2fa', (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.redirect('/api/auth/discord');
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { isAuthenticated, hasStaffRole } = require('../lib/session');



router.get('/', isAuthenticated, hasStaffRole, (req, res) => {
    const roles = [];
    if (req.user.guildMember && req.user.guildMember.roles) {
        if (req.user.guildMember.roles.includes(process.env.DIRECTOR_ROLE_ID)) {
            roles.push('Director');
        }
        if (req.user.guildMember.roles.includes(process.env.DEVELOPER_ROLE_ID)) {
            roles.push('Developer');
        }
        if (req.user.guildMember.roles.includes(process.env.SOUND_DESIGN_ROLE_ID)) {
            roles.push('Sound Design');
        }
    }

    const userWithData = {
        ...req.user,
        roles: req.user.roles || []
    };

    res.render('dashboard', {
        title: 'Staff Dashboard | Asteroid Studios',
        user: userWithData
    });
});

module.exports = router;
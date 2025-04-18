const express = require('express');
const router = express.Router();
const { isAuthenticated, hasStaffRole } = require('../lib/session');
const Users = require('../models/Users'); // Import the Users model

const hasDirectorRole = (req, res, next) => {
    if (req.user.guildMember && req.user.guildMember.roles.includes(process.env.DIRECTOR_ROLE_ID)) {
        return next();
    }
    res.render('no-access', {
        title: 'Access Restricted | Asteroid Studios',
        user: req.user
    });
};

router.get('/', isAuthenticated, hasStaffRole, hasDirectorRole, async (req, res) => {
    try {
        const users = await Users.find({}).lean();

        // Just use the roles as they are (they should already be names)
        const filteredUsers = users.map(user => ({
            ...user,
            roles: user.roles.filter(role => 
                typeof role === 'string' && 
                !role.match(/^\d+$/) // Filter out any remaining numeric role IDs
            )
        }));

        const roles = [];
        if (req.user.guildMember && req.user.guildMember.roles) {
            if (req.user.guildMember.roles.includes(process.env.DIRECTOR_ROLE_ID)) {
                roles.push('Director');
            }
        }

        res.render('admin', {
            title: 'Admin Panel | Asteroid Studios',
            user: {
                ...req.user,
                roles: req.user.roles || []
            },
            users: filteredUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('no-access', {
            title: 'Error | Asteroid Studios',
            message: 'Failed to fetch users'
        });
    }
});

module.exports = router;
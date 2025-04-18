const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};


const hasStaffRole = (req, res, next) => {
    if (req.user && req.user.staffMember) {
        return next();
    }
    res.render('no-access', {
        title: 'Access Restricted | Asteroid Studios',
        user: req.user
    });
};

const passport = require('passport');
const mongoose = require('mongoose');

// Create the Users model
// Remove these lines:
// const Users = mongoose.model('Users', new mongoose.Schema({
//     username: { type: String, required: true },
//     join_date: { type: Date, default: Date.now },
//     last_login: { type: Date, default: Date.now },
//     roles: { type: String, required: true }
// }, { collection: 'portal_users' }));

passport.serializeUser((user, done) => {
    done(null, user);
});

const Users = require('../models/Users');

passport.deserializeUser(async (user, done) => {
    try {
        const dbUser = await Users.findById(user.userId);
        if (!dbUser) {
            return done(new Error('User not found'));
        }
        done(null, dbUser);
    } catch (error) {
        done(error);
    }
});

module.exports = {
    isAuthenticated,
    hasStaffRole
};
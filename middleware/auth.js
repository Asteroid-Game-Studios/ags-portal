const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.id) {
        console.log(`User ${req.user.id} authenticated with session ${req.user.sessionId || req.sessionID}`);
        return next();
    }
    console.log('Authentication failed, redirecting to login');
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

module.exports = {
    isAuthenticated,
    hasStaffRole
};
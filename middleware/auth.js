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

module.exports = {
    isAuthenticated,
    hasStaffRole
};
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    if (req.query.error === 'unauthorized') {
        return res.render('no-access', {
            title: 'Access Restricted | Asteroid Studios',
            user: req.user
        });
    }
    res.render('index', {
        title: 'Asteroid Studios Staff Portal',
        user: req.user,
        error: req.query.error
    });
});

module.exports = router;
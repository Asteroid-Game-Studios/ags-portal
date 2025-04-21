const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {
        title: 'Staff Portal | Asteroid Studios',
        user: req.user || null,
        error: req.query.error || null
    });
});

module.exports = router;
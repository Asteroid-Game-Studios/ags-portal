const express = require('express');
const router = express.Router();
const { fetchUserById } = require('../../lib/discord');

router.get('/:userId', async (req, res) => {
    try {
        const userData = await fetchUserById(req.params.userId);
        res.json(userData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

module.exports = router;
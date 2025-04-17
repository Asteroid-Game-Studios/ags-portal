const express = require('express');
const router = express.Router();
const axios = require('axios');
const { isAuthenticated, hasStaffRole } = require('../middleware/auth');

router.get('/users/:userId', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const response = await axios.get(
            `https://discord.com/api/v10/users/${userId}`,
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                }
            }
        );
        
        const userData = response.data;
        
        res.json({
            id: userData.id,
            username: userData.username,
            avatar: userData.avatar 
                ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` 
                : 'https://cdn.discordapp.com/embed/avatars/0.png'
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

module.exports = router;
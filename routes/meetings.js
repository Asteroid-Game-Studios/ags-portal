const express = require('express');
const router = express.Router();
const { isAuthenticated, hasStaffRole } = require('../lib/session');
const Meeting = require('../models/Meeting');

// Page route
router.get('/', isAuthenticated, hasStaffRole, async (req, res) => {
    try {
        const meetings = await Meeting.find({
            date: { $gte: new Date() }
        })
        .sort({ date: 1 })
        .lean(); // Add lean() to get plain JavaScript objects

        res.render('meetings', {
            title: 'Meetings | Asteroid Studios',
            user: req.user,
            meetings: meetings,
            roles: {
                director: process.env.DIRECTOR_ROLE_ID,
                developer: process.env.DEVELOPER_ROLE_ID,
                soundDesign: process.env.SOUND_DESIGN_ROLE_ID
            }
        });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API route
router.post('/', isAuthenticated, hasStaffRole, async (req, res) => {
    try {
        const meeting = new Meeting({
            title: req.body.title,
            date: new Date(req.body.date),
            duration: req.body.duration,
            description: req.body.description,
            createdBy: req.user.id,
            invitedRoles: req.body.invitedRoles
        });

        await meeting.save();
        res.status(201).send();
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).send('Error creating meeting');
    }
});

// Add this route after the existing routes
router.delete('/:id', isAuthenticated, hasStaffRole, async (req, res) => {
    try {
        const meeting = await Meeting.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found or unauthorized' });
        }

        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ error: 'Error deleting meeting' });
    }
});
module.exports = router;
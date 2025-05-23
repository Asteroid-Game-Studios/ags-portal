const express = require('express');
const router = express.Router();
const { isAuthenticated, hasDirectorRole, hasStaffRole } = require('../lib/session'); // Add hasStaffRole
const Meeting = require('../models/Meeting');

// Page route
router.get('/', isAuthenticated, hasDirectorRole, async (req, res) => {
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
        const { title, date, duration, description, invitedRoles, meetingRoom } = req.body;
        const meeting = new Meeting({
            title,
            date,
            duration,
            description,
            invitedRoles,
            meetingRoom, // <-- Save meetingRoom
            createdBy: req.user.id, // or however you track the creator
            participants: []
        });
        await meeting.save();

        // Notify Discord bot
        const { sendMeetingNotification } = require('../lib/discordBot');
        sendMeetingNotification(meeting);

        res.status(201).json({ success: true, meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create meeting' });
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

        // Notify Discord bot about the cancellation
        const { sendMeetingNotification } = require('../lib/discordBot');
        sendMeetingNotification(meeting, true); // Pass true to indicate cancellation

        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ error: 'Error deleting meeting' });
    }
});
module.exports = router;
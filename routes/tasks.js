const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { isAuthenticated, hasStaffRole } = require('../lib/session');

// Add this GET route handler
router.get('/', isAuthenticated, hasStaffRole, async (req, res) => {
    try {
        const tasks = await Task.find({}).sort({ createdAt: -1 }).lean();
        res.render('tasks', {
            title: 'Tasks | Asteroid Studios',
            user: req.user,
            tasks: tasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/', isAuthenticated, hasStaffRole, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            createdBy: req.user.id,
            assignee: {
                username: req.user.username,
                avatar: req.user.avatar
            }
        });
        await task.save();
        res.status(201).json(task);  // Changed from .send() to .json()
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
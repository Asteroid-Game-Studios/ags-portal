const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../lib/session');
const Task = require('../models/Task');
const User = require('../models/User'); // Add User model

// Get all tasks with additional data
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.find()
            .sort({ createdAt: -1 })
            .populate('assignee', 'username avatar') // Populate assignee details
            .lean();

        const users = await User.find({}, 'username avatar'); // Get all users for assignee dropdown

        res.render('tasks', {
            title: 'Tasks | Asteroid Studios',
            user: req.user,
            tasks: tasks,
            users: users,
            statusOptions: ['todo', 'in-progress', 'done'],
            priorityOptions: ['low', 'medium', 'high', 'urgent']
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Create new task with enhanced fields
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            assignee: req.body.assignee,
            dueDate: req.body.dueDate,
            status: req.body.status || 'todo',
            priority: req.body.priority || 'medium',
            tags: req.body.tags ? req.body.tags.split(',') : [],
            createdBy: req.user.id
        });

        await task.save();
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Error creating task' });
    }
});

// Update task status (for drag and drop)
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(task);
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ error: 'Error updating task status' });
    }
});

// Delete task
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Error deleting task' });
    }
});

module.exports = router;
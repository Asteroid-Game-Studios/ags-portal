const express = require('express');
const router = express.Router();
const Task = require('../../models/Task');
const { isAuthenticated, hasStaffRole } = require('../../lib/session');

router.post('/', isAuthenticated, hasStaffRole, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            createdBy: req.user.id
        });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(400).json({ error: error.message });
    }
});

router.patch('/:id', isAuthenticated, hasStaffRole, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
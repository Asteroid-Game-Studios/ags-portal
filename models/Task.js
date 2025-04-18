const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo'
    },
    assignee: {
        avatar: String,
        username: String
    },
    dueDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
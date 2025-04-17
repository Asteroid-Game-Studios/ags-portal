const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: Date,
    status: { 
        type: String, 
        enum: ['todo', 'in-progress', 'done'], 
        default: 'todo' 
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    tags: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    duration: { type: Number, required: true },
    description: String,
    createdBy: { type: String, required: true },
    participants: [String],
    invitedRoles: [String],
    meetingRoom: { type: String, required: true } // <-- Add this line
});

module.exports = mongoose.model('Meeting', meetingSchema);
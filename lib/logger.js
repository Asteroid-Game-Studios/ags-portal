const Log = require('../models/Log');

class Logger {
    async log(data) {
        try {
            await Log.create(data);
        } catch (error) {
            console.error('Error writing to MongoDB log:', error);
        }
    }

    async getRecentLogs(count = 100) {
        try {
            return await Log.find().sort({ timestamp: -1 }).limit(count).lean();
        } catch (error) {
            console.error('Error reading logs from MongoDB:', error);
            return [];
        }
    }
}

module.exports = {
    info: (...args) => console.info('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args) // <-- Add this line
};
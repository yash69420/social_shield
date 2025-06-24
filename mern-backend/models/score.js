const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for faster querying
ScoreSchema.index({ email: 1 });
ScoreSchema.index({ date: -1 });

// Add pre-save hook for debugging
ScoreSchema.pre('save', function (next) {
    next();
});

module.exports = mongoose.model('Score', ScoreSchema);
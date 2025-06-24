const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    picture: {
        type: String
    },
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    googleTokens: {
        access_token: String,
        refresh_token: String,
        expiry_date: Number
    },
    gmailTokens: {
        access_token: String,
        refresh_token: String,
        expiry_date: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if the model already exists before defining it
module.exports = mongoose.models.User || mongoose.model('User', userSchema);

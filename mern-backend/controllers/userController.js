const Score = require('../models/score');
const User = require('../models/user');
const mongoose = require('mongoose');

// Delete user and all associated data
exports.deleteUser = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // 1. Delete all scores for this user
        const deleteScoresResult = await Score.deleteMany({ email: email.toLowerCase() });

        // 2. Delete the user record itself
        const deleteUserResult = await User.deleteOne({ email: email.toLowerCase() });

        // 3. Try to delete email analysis results from Flask backend
        try {
            // Use environment variable instead of hardcoded URL
            const flaskApiUrl = process.env.FLASK_API_URL || "http://localhost:5000";
            const fetch = require('node-fetch');
            const flaskResponse = await fetch(`${flaskApiUrl}/api/delete-user-data`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.toLowerCase() })
            });

            if (!flaskResponse.ok) {
                // Only warn if Flask backend could not delete, but don't fail the entire operation
                console.warn("Warning: Could not delete user data from Flask backend");
            }
        } catch (flaskError) {
            // Don't fail if Flask backend is unavailable
            console.warn("Warning: Could not reach Flask backend to delete user data", flaskError);
        }

        // 4. Return success with signal to clear all local storage
        return res.status(200).json({
            success: true,
            message: 'User data deleted successfully',
            clearAllData: true, // Signal to frontend to clear all data
            details: {
                scoresDeleted: deleteScoresResult.deletedCount,
                userDeleted: deleteUserResult.deletedCount === 1
            }
        });
    } catch (error) {
        console.error("Error deleting user:", error.message, error.stack);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting user data',
            error: error.message
        });
    }
}; 
const Score = require('../models/score');
const mongoose = require('mongoose');

// Get scores for a user
exports.getScores = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find scores for this user, sorted by date descending
        const scores = await Score.find({ email })
            .sort({ date: -1 })
            .limit(10); // Limit to most recent 10 scores

        return res.status(200).json({
            success: true,
            scores
        });
    } catch (error) {
        console.error('Error fetching scores:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Save a new score
exports.saveScore = async (req, res) => {
    try {
        const { email, score } = req.body;

        // Add better email validation
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate score
        if (score === undefined || score < 0 || score > 100) {
            return res.status(400).json({
                success: false,
                message: 'Score must be between 0 and 100'
            });
        }

        // Create new score document
        const newScore = new Score({
            email,
            score,
            date: req.body.date || Date.now()
        });

        // Save to database with promise chain for better error handling
        const savedScore = await newScore.save()
            .catch(err => {
                // Check if it's a validation error
                if (err.name === 'ValidationError') {
                    console.error("VALIDATION ERROR DETAILS:", err.errors);
                }
                throw err; // Rethrow to be caught by the outer catch
            });

        return res.status(201).json({
            success: true,
            message: 'Score saved successfully',
            score: savedScore
        });
    } catch (error) {
        console.error("Error saving score:", error.message, error.stack);

        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get statistics for a user
exports.getStats = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const stats = await Score.aggregate([
            { $match: { email } },
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: "$score" },
                    maxScore: { $max: "$score" },
                    totalGames: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            stats: stats[0] || { avgScore: 0, maxScore: 0, totalGames: 0 }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
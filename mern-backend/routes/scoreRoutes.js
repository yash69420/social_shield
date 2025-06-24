const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
// Temporarily commenting out authentication to test database storage
// const authenticate = require('../middleware/authMiddleware');

// Get scores for a user
router.get('/', scoreController.getScores);

// Save a new score
router.post('/', scoreController.saveScore);

// Get statistics for a user
router.get('/stats', scoreController.getStats);

module.exports = router;
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Delete user and all associated data
router.delete('/delete', userController.deleteUser);

module.exports = router;
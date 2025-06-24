//authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (no authentication required)
router.get("/google-login", authController.googleLogin);
router.post("/google-login", authController.googleLogin);
router.post("/logout", authController.logout);

// Check authentication status
router.get("/check-auth", authMiddleware, (req, res) => {
    res.json({ message: "Authentication successful", user: req.user });
});

module.exports = router;
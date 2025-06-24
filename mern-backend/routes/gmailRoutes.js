//gmailRoutes.js
const express = require("express");
const gmailController = require("../controllers/gmailController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Gmail OAuth Flow
router.get("/auth", authMiddleware, gmailController.gmailAuthRedirect);
router.get("/callback", gmailController.gmailAuthCallback);

// Add a new route for verification
router.post("/verify", authMiddleware, gmailController.verifyGmailConnection);

// Add the new Gmail status endpoint
router.get("/status", authMiddleware, gmailController.getGmailStatus);

// Fetch Emails (Protected)
router.get("/emails", authMiddleware, gmailController.getEmails);
router.get("/emails/:id", authMiddleware, gmailController.getEmailById);

// Add a test endpoint for connectivity checks
router.get("/test", authMiddleware, (req, res) => {
    res.json({ success: true, message: "Gmail API connection is working" });
});

module.exports = router;

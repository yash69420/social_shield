const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Use environment variable for API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Debug endpoint to check environment variables
router.get('/debug', (req, res) => {
    const envDebug = {
        GEMINI_API_KEY_SET: !!GEMINI_API_KEY,
        GEMINI_API_KEY_LENGTH: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
        GEMINI_API_KEY_PREVIEW: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 5)}` : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
        TOTAL_ENV_VARS: Object.keys(process.env).length,
        TIMESTAMP: new Date().toISOString(),
        MODEL_USED: 'gemini-2.0-flash'
    };

    res.json({
        success: true,
        debug: envDebug,
        message: 'Environment variables checked - Using gemini-2.0-flash'
    });
});

// Test endpoint to check if Gemini API works
router.get('/test-api', async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY is not set'
            });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: "Say 'Hello, this is a test from your backend using gemini-2.0-flash!'"
                            }
                        ]
                    }
                ]
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: 'Gemini API request failed',
                details: data,
                model: 'gemini-2.0-flash'
            });
        }

        res.json({
            success: true,
            message: 'Gemini API is working with gemini-2.0-flash!',
            model: 'gemini-2.0-flash',
            geminiResponse: data,
            keyPreview: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 5)}` : 'Not set'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to test Gemini API',
            details: error.message,
            model: 'gemini-2.0-flash'
        });
    }
});

// Proxy endpoint for Gemini API
router.post('/generate-email', async (req, res) => {
    try {
        const { promptType } = req.body;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY is not set'
            });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Generate a realistic ${promptType} email that would be typical in a professional setting.\n\nDO NOT include any labels or indicators in the output that reveal whether this is safe or suspicious.\nDO NOT prefix the email with "Example: Safe" or "Example: Phishing" or any similar marker.\nDO NOT include any metadata about the email classification.\n\nIf ${promptType === "suspicious"}, include subtle phishing indicators but don't make it too obvious.\nIf ${promptType === "legitimate"}, make it completely normal and safe.\n\nInclude a clear subject line and make the email body approximately 290 characters long.\nFocus only on the actual email content as it would appear in a real inbox.\nFormat as "Subject: [subject]" followed by the email body on a new line.`
                            }
                        ]
                    }
                ]
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: 'Gemini API request failed',
                details: data,
                model: 'gemini-2.0-flash'
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate email',
            details: error.message,
            model: 'gemini-2.0-flash'
        });
    }
});

module.exports = router;
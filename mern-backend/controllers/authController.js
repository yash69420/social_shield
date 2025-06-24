const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/user");  // Fixed casing to match actual file name
const { generateToken } = require("../utils/jwtUtils");
const dotenv = require("dotenv");

dotenv.config();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Middleware to check if the user is authenticated
exports.googleLogin = async (req, res) => {
    try {
        const code = req.query.code || req.body.code;
        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.id_token) throw new Error("Failed to retrieve tokens from Google");

        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload.email) throw new Error("Invalid user data from Google");

        let user = await User.findOne({ email: payload.email });

        if (!user) {
            user = new User({
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                googleId: payload.sub
            });
        } else {
            user.name = payload.name;
            user.picture = payload.picture;
        }

        if (tokens.refresh_token) {
            user.googleTokens = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date
            };
        } else if (tokens.access_token && user.googleTokens) {
            user.googleTokens.access_token = tokens.access_token;
            user.googleTokens.expiry_date = tokens.expiry_date;
        }

        await user.save();

        const appToken = generateToken({ id: user._id, email: user.email, name: user.name });

        // If it's a direct request (from browser redirect)
        if (req.method === 'GET') {
            // Redirect to frontend with token
            return res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${appToken}`);
        }

        // If it's an API request (from frontend)
        res.status(200).json({
            token: appToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        });

    } catch (error) {
        // If it's a direct request
        if (req.method === 'GET') {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
        }

        // If it's an API request
        res.status(500).json({
            message: "Authentication failed",
            error: error.message
        });
    }
};

exports.logout = (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
};

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Ensure JWT_SECRET is defined in production
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined. This is required in production for security.');
}

// Generate a token for a user
exports.generateToken = (payload) => {
    // In development, if JWT_SECRET is not set, use a placeholder and warn
    const secretToUse = JWT_SECRET || 'development-fallback-secret-do-not-use-in-production';
    if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
        console.warn('WARNING: JWT_SECRET is not set. Using a development fallback. Set JWT_SECRET in your .env for proper security.');
    }
    return jwt.sign(payload, secretToUse, { expiresIn: JWT_EXPIRES_IN });
};

// Verify a token and return decoded payload
exports.verifyToken = (token) => {
    // In development, if JWT_SECRET is not set, use a placeholder and warn
    const secretToUse = JWT_SECRET || 'development-fallback-secret-do-not-use-in-production';
    if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
        console.warn('WARNING: JWT_SECRET is not set. Using a development fallback. Set JWT_SECRET in your .env for proper security.');
    }
    return jwt.verify(token, secretToUse);
};
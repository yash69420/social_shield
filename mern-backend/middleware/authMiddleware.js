const { verifyToken } = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {
    // Check different auth header formats
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No authorization header provided.' });
    }

    // Extract token regardless of format (Bearer or not)
    let token;
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
    } else {
        token = authHeader;
    }

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token using our utility
        const decoded = verifyToken(token);

        // Modify this check to accept your token structure
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token structure.' });
        }

        // Just pass through the authentication for now
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
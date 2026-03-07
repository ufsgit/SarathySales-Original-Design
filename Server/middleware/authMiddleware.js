const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token.
 * Expects 'Authorization: Bearer <token>' header.
 */
const authMiddleware = (req, res, next) => {
    // Skip authentication for PDF routes to allow opening in new tabs without session tokens in URL
    if (req.url.includes('/pdf/') || req.url.includes('/create-pdf/') || req.url.includes('/pdf-by-no/')) {
        return next();
    }

    // 1. Get token from header or query param
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        // 2. Verify token
        const secret = process.env.JWT_SECRET || 'sarathy_secret_key_2024';
        const decoded = jwt.verify(token, secret);

        // 3. Attach user to request object
        // Normalize role to number for easier comparison
        req.user = {
            ...decoded,
            role: Number(decoded.role)
        };
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;

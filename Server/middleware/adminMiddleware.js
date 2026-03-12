/**
 * Middleware to check if the user has an admin role.
 * Should be used AFTER authMiddleware which attaches 'req.user'.
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    const { role, role_des } = req.user;

    // Check if role is 1 or role_des is 'admin'
    if (role === 1 || role_des === 'admin') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.'
    });
};

module.exports = adminMiddleware;

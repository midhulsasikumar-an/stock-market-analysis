/**
 * Authentication Middleware
 * Validates JWT tokens and protects routes
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to verify JWT token.
 * Requires process.env.JWT_SECRET to be set.
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No authorization token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Malformed authorization header"
            });
        }

        // Verify token — crashes intentionally if JWT_SECRET is not set
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user ID to request object
        req.userId = decoded.userId;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again.",
                error: "TOKEN_EXPIRED"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
                error: "TOKEN_INVALID"
            });
        }

        return res.status(401).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

/**
 * Optional auth middleware — does not fail if token is missing,
 * but still validates the token if present.
 */
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.userId = decoded.userId;
            }
        }
        next();
    } catch (error) {
        // Continue without authentication for optional routes
        next();
    }
};

/**
 * Middleware to check if user has admin role
 * Must be used AFTER authMiddleware
 */
const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying admin privileges"
        });
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    adminMiddleware
};

const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ========================================
// RATE LIMITERS
// ========================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: "Too many login attempts. Please wait 15 minutes and try again."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Only count failed responses
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        message: "Too many accounts created from this IP. Please try again in an hour."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const googleLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many Google auth attempts. Please wait 15 minutes."
    }
});

// ========================================
// HELPERS
// ========================================
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not configured");
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" } // Reduced from 7d to 1d
    );
};

const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }
    return null;
};

const sanitizeUsername = (input) => {
    const cleaned = (input || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);

    return cleaned;
};

const generateUniqueUsername = async (baseCandidate) => {
    const base = sanitizeUsername(baseCandidate) || "user";

    for (let i = 0; i < 50; i += 1) {
        const suffix = i === 0 ? "" : Math.floor(1000 + Math.random() * 9000).toString();
        const username = `${base}${suffix}`.slice(0, 20);
        const existing = await User.findOne({ username }).select("_id");
        if (!existing) return username;
    }

    return `user${Date.now().toString().slice(-8)}`;
};

// ========================================
// USER REGISTRATION (EMAIL)
// ========================================
router.post(
    "/register",
    registerLimiter,
    [
        body("username")
            .trim()
            .isLength({ min: 3, max: 20 }).withMessage("Username must be between 3 and 20 characters")
            .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores"),
        body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
        body("password")
            .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
            .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
            .matches(/[0-9]/).withMessage("Password must contain at least one number")
            .matches(/[!@#$%^&*]/).withMessage("Password must contain at least one special character (!@#$%^&*)")
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { username, email, password, registrationSource } = req.body;
            const normalizedUsername = username.trim().toLowerCase();

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered. Please login or use a different email."
                });
            }

            const existingUsername = await User.findOne({ username: normalizedUsername });
            if (existingUsername) {
                return res.status(409).json({
                    success: false,
                    message: "Username already taken. Please choose another username."
                });
            }

            // Create new user
            const newUser = new User({
                username: normalizedUsername,
                email: email.toLowerCase(),
                password,
                registrationSource: registrationSource === "google" ? "google" : "email",
                accountStatus: "active",
                emailVerified: false
            });

            await newUser.save();

            // Generate JWT token
            const token = generateToken(newUser._id);

            // Return user without password
            const userWithoutPassword = await User.findById(newUser._id).select("-password");

            return res.status(201).json({
                success: true,
                message: "Account created successfully",
                token,
                user: userWithoutPassword
            });
        } catch (error) {
            console.error("Registration error:", error.message);
            return res.status(500).json({
                success: false,
                message: "An error occurred during registration. Please try again."
                // NOTE: error.message is intentionally NOT returned to the client
            });
        }
    }
);

// ========================================
// USER LOGIN (EMAIL)
// ========================================
router.post(
    "/login",
    loginLimiter,
    [
        body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
        body("password").notEmpty().withMessage("Password is required")
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { email, password } = req.body;

            // Find user with password field
            const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            // Check if account is locked
            if (user.isAccountLocked()) {
                const unlockTime = new Date(user.lockUntil).toLocaleTimeString();
                return res.status(423).json({
                    success: false,
                    message: `Account is temporarily locked due to too many failed attempts. Try again after ${unlockTime}.`
                });
            }

            // Check account status
            if (user.accountStatus !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Account is not active. Please contact support."
                });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                await user.incLoginAttempts();
                const remaining = 5 - (user.loginAttempts + 1);
                return res.status(401).json({
                    success: false,
                    message: remaining > 0
                        ? `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`
                        : "Invalid email or password. Account has been locked for 2 hours."
                });
            }

            // Reset login attempts on successful login
            await user.resetLoginAttempts();

            // Update last login
            await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

            // Generate JWT token
            const token = generateToken(user._id);

            // Return user without password
            const userWithoutPassword = await User.findById(user._id).select("-password");

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                user: userWithoutPassword
            });
        } catch (error) {
            console.error("Login error:", error.message);
            return res.status(500).json({
                success: false,
                message: "An error occurred during login. Please try again."
            });
        }
    }
);

// ========================================
// GOOGLE OAUTH AUTHENTICATION
// ========================================
router.post("/google", googleLimiter, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Google token is required"
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes("your-google-client-id")) {
            return res.status(503).json({
                success: false,
                message: "Google authentication is not configured on this server."
            });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name, family_name, picture } = payload;

        // Check if user exists
        let user = await User.findOne({
            $or: [{ googleId }, { email: email.toLowerCase() }]
        });

        const isNewUser = !user;

        if (!user) {
            const generatedUsername = await generateUniqueUsername(given_name || email.split("@")[0]);
            user = new User({
                username: generatedUsername,
                googleId,
                email: email.toLowerCase(),
                firstName: given_name,
                lastName: family_name,
                profileImage: picture,
                registrationSource: "google",
                emailVerified: true,
                accountStatus: "active"
            });
            await user.save();
        } else {
            // Update existing user
            if (!user.googleId) user.googleId = googleId;
            if (!user.profileImage && picture) user.profileImage = picture;
            if (!user.username) {
                user.username = await generateUniqueUsername(user.firstName || user.email.split("@")[0]);
            }
            user.lastLogin = new Date();
            await user.save();
        }

        // Generate JWT token
        const jwtToken = generateToken(user._id);

        // Return user without password
        const userWithoutPassword = await User.findById(user._id).select("-password");

        return res.status(200).json({
            success: true,
            message: "Google authentication successful",
            token: jwtToken,
            user: userWithoutPassword,
            isNewUser
        });
    } catch (error) {
        console.error("Google authentication error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Google authentication failed. Please try again."
        });
    }
});

// ========================================
// VERIFY JWT TOKEN
// ========================================
router.post("/verify-token", authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Token is valid",
        userId: req.userId
    });
});

// ========================================
// GET USER PROFILE — Protected
// ========================================
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Profile fetch error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching user profile"
        });
    }
});

// ========================================
// UPDATE USER PROFILE — Protected
// ========================================
router.put(
    "/profile",
    authMiddleware,
    [
        body("firstName").optional().trim().isLength({ max: 50 }).withMessage("First name too long"),
        body("lastName").optional().trim().isLength({ max: 50 }).withMessage("Last name too long")
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { firstName, lastName, preferences } = req.body;

            const user = await User.findByIdAndUpdate(
                req.userId,
                {
                    ...(firstName !== undefined && { firstName: firstName.trim() }),
                    ...(lastName !== undefined && { lastName: lastName.trim() }),
                    ...(preferences && { preferences })
                },
                { new: true, runValidators: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                user
            });
        } catch (error) {
            console.error("Profile update error:", error.message);
            return res.status(500).json({
                success: false,
                message: "Error updating profile"
            });
        }
    }
);

// ========================================
// LOGOUT — Signals client to clear token
// ========================================
router.post("/logout", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logout successful. Please clear your local session."
    });
});

module.exports = router;

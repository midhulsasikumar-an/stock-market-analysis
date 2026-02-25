const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        password: {
            type: String,
            select: false
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },
        profileImage: {
            type: String,
            default: null
        },
        accountStatus: {
            type: String,
            enum: ["active", "suspended", "deleted"],
            default: "active"
        },
        registrationSource: {
            type: String,
            enum: ["email", "google"],
            required: true
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            select: false
        },
        emailVerificationExpires: {
            type: Date,
            select: false
        },
        passwordResetToken: {
            type: String,
            select: false
        },
        passwordResetExpires: {
            type: Date,
            select: false
        },
        lastLogin: {
            type: Date,
            default: null
        },
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date,
            default: null
        },
        preferences: {
            theme: {
                type: String,
                enum: ["dark", "light"],
                default: "dark"
            },
            notifications: {
                type: Boolean,
                default: true
            },
            twoFactorAuth: {
                type: Boolean,
                default: false
            }
        }
    },
    {
        timestamps: true
    }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12); // Increased from 10 to 12
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function () {
    return this.lockUntil && new Date() < this.lockUntil;
};

/**
 * FIXED: Previously inverted — account was locking after first failed attempt.
 * Now correctly: increments counter, only locks when threshold is reached.
 */
userSchema.methods.incLoginAttempts = async function () {
    const newAttempts = this.loginAttempts + 1;

    // If lock has expired, reset and start fresh count
    if (this.lockUntil && new Date() >= this.lockUntil) {
        return this.updateOne({
            $set: { loginAttempts: 1, lockUntil: null }
        });
    }

    // Lock account if threshold reached
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        return this.updateOne({
            $set: {
                loginAttempts: newAttempts,
                lockUntil: new Date(Date.now() + LOCK_DURATION_MS)
            }
        });
    }

    // Otherwise just increment
    return this.updateOne({
        $inc: { loginAttempts: 1 }
    });
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: { loginAttempts: 0, lockUntil: null }
    });
};

module.exports = mongoose.model("User", userSchema);
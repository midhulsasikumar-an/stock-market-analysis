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
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 20,
            match: /^[a-zA-Z0-9_]+$/
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
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
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
        refreshTokenHash: {
            type: String,
            select: false
        },
        preferences: {
            theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
            notifications: { type: Boolean, default: true }
        },
        securitySettings: {
            twoFactorEnabled: { type: Boolean, default: false }
        }
    },
    {
        timestamps: true
    }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ accountStatus: 1 });

// ─── Pre-save: hash password ────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ─── Instance Methods ───────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAccountLocked = function () {
    return this.lockUntil && new Date() < this.lockUntil;
};

/**
 * Increment failed login attempts.
 * Locks account after MAX_LOGIN_ATTEMPTS threshold is reached.
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

userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: { loginAttempts: 0, lockUntil: null }
    });
};

module.exports = mongoose.model("User", userSchema);

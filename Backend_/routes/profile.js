const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// --- Setup Multer for Local Uploads ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.userId + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg and .jpeg format allowed!'), false);
        }
    }
});

router.use(authMiddleware);

// ==========================================
// GET /api/profile
// Get full account info including preferences
// ==========================================
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -__v');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// PUT /api/profile/update
// Update Name & Profile Picture
// ==========================================
router.put('/update', upload.single('profileImage'), async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;

        if (req.file) {
            // Store the relative path to be served locally
            user.profileImage = `/uploads/${req.file.filename}`;
        }

        await user.save();
        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Error updating profile' });
    }
});

// ==========================================
// PUT /api/profile/security
// Update Password
// ==========================================
router.put('/security', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password required' });
        }

        const user = await User.findById(req.userId).select('+password');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        user.password = newPassword;
        // Password hashing is handled automatically by pre-save hook in Mongoose model
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating security settings' });
    }
});

// ==========================================
// PUT /api/profile/preferences
// Update Theme, Notifications, etc.
// ==========================================
router.put('/preferences', async (req, res) => {
    try {
        const { theme, notifications } = req.body;
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.preferences) {
            if (theme !== undefined) user.preferences.theme = theme;
            if (notifications !== undefined) user.preferences.notifications = notifications;
        } else {
            user.preferences = {
                theme: theme || 'dark',
                notifications: notifications !== undefined ? notifications : true
            };
        }

        await user.save();
        res.json({ success: true, message: 'Preferences updated successfully', preferences: user.preferences });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating preferences' });
    }
});

module.exports = router;

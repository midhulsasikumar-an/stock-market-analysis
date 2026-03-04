const express = require("express");
const router = express.Router();
const UserSettings = require("../models/UserSettings");
const { authMiddleware } = require("../middleware/auth");

// GET /api/settings — get current user settings (or defaults)
router.get("/", authMiddleware, async (req, res) => {
    try {
        let settings = await UserSettings.findOne({ userId: req.userId });
        if (!settings) {
            // Auto-create default settings on first access
            settings = await UserSettings.create({ userId: req.userId });
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching settings" });
    }
});

// PUT /api/settings — update settings
router.put("/", authMiddleware, async (req, res) => {
    try {
        const allowed = ["theme", "defaultCurrency", "defaultExchange", "notifications", "dashboardLayout", "watchlistLimit"];
        const updates = {};
        allowed.forEach(key => {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        });

        const settings = await UserSettings.findOneAndUpdate(
            { userId: req.userId },
            { $set: updates },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating settings" });
    }
});

module.exports = router;

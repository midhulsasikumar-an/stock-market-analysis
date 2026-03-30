const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const { authMiddleware } = require("../middleware/auth");

// GET /api/alerts — all active alerts for user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const alerts = await Alert.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ success: true, count: alerts.length, data: alerts });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching alerts" });
    }
});

// POST /api/alerts — create alert
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { symbol, type, targetValue, message, notifyVia } = req.body;
        if (!symbol || !type || targetValue == null) {
            return res.status(400).json({ success: false, message: "symbol, type, targetValue required" });
        }
        const alert = new Alert({
            userId: req.userId,
            symbol: symbol.toUpperCase(),
            type,
            targetValue,
            message,
            notifyVia: notifyVia || ["app"]
        });
        await alert.save();
        res.status(201).json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error creating alert" });
    }
});

// PATCH /api/alerts/:id — toggle active/deactivate
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const alert = await Alert.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { isActive: req.body.isActive },
            { new: true }
        );
        if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating alert" });
    }
});

// DELETE /api/alerts/:id — delete alert
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        await Alert.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ success: true, message: "Alert removed" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting alert" });
    }
});

module.exports = router;

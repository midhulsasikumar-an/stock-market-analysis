const express = require("express");
const router = express.Router();
const AdminAnnouncement = require("../models/AdminAnnouncement");

router.get("/active", async (req, res) => {
    try {
        const announcements = await AdminAnnouncement.find({ isActive: true })
            .select("title message severity target createdAt isActive")
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ success: true, data: announcements });
    } catch (error) {
        console.error("Active announcements error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching active announcements" });
    }
});

module.exports = router;

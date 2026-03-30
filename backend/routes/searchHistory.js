const express = require("express");
const router = express.Router();
const SearchHistory = require("../models/SearchHistory");
const { authMiddleware } = require("../middleware/auth");

// GET /api/search-history — recent 20 searches
router.get("/", authMiddleware, async (req, res) => {
    try {
        const history = await SearchHistory.find({ userId: req.userId })
            .sort({ searchedAt: -1 })
            .limit(20);
        res.json({ success: true, data: history });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching search history" });
    }
});

// POST /api/search-history — log a search
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { symbol, name } = req.body;
        if (!symbol) return res.status(400).json({ success: false, message: "symbol is required" });

        // Upsert: update timestamp if already exists, else insert
        const entry = await SearchHistory.findOneAndUpdate(
            { userId: req.userId, symbol: symbol.toUpperCase() },
            { name, searchedAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Keep only latest 20 entries per user
        const count = await SearchHistory.countDocuments({ userId: req.userId });
        if (count > 20) {
            const oldest = await SearchHistory.find({ userId: req.userId })
                .sort({ searchedAt: 1 })
                .limit(count - 20);
            const ids = oldest.map(d => d._id);
            await SearchHistory.deleteMany({ _id: { $in: ids } });
        }

        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error logging search" });
    }
});

// DELETE /api/search-history — clear all history
router.delete("/", authMiddleware, async (req, res) => {
    try {
        await SearchHistory.deleteMany({ userId: req.userId });
        res.json({ success: true, message: "History cleared" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error clearing history" });
    }
});

module.exports = router;

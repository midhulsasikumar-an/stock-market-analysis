const express = require("express");
const router = express.Router();
const WatchlistUser = require("../models/WatchlistUser");
const { authMiddleware } = require("../middleware/auth");

/**
 * @route   GET /api/watchlist
 * @desc    Get current user's watchlist
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const watchlist = await WatchlistUser.find({ userId: req.userId }).sort({ addedAt: -1 });
        res.json({ success: true, count: watchlist.length, data: watchlist });
    } catch (err) {
        console.error("Fetch watchlist error:", err.message);
        res.status(500).json({ success: false, message: "Server error fetching watchlist" });
    }
});

/**
 * @route   POST /api/watchlist
 * @desc    Add a stock to watchlist
 * @access  Private
 */
router.post("/", authMiddleware, async (req, res) => {
    const { symbol, name, type } = req.body;
    if (!symbol) return res.status(400).json({ success: false, message: "Symbol is required" });

    try {
        // Check if already exists
        const existing = await WatchlistUser.findOne({ userId: req.userId, symbol: symbol.toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: "Symbol already in watchlist" });
        }

        const newItem = new WatchlistUser({
            userId: req.userId,
            symbol: symbol.toUpperCase(),
            name: name || symbol.toUpperCase(),
            type: type || "stock"
        });

        await newItem.save();
        res.status(201).json({ success: true, data: newItem });
    } catch (err) {
        console.error("Add watchlist error:", err.message);
        res.status(500).json({ success: false, message: "Server error adding to watchlist" });
    }
});

/**
 * @route   DELETE /api/watchlist/:symbol
 * @desc    Remove a stock from watchlist
 * @access  Private
 */
router.delete("/:symbol", authMiddleware, async (req, res) => {
    try {
        const result = await WatchlistUser.findOneAndDelete({
            userId: req.userId,
            symbol: req.params.symbol.toUpperCase()
        });

        if (!result) {
            return res.status(404).json({ success: false, message: "Symbol not found in watchlist" });
        }

        res.json({ success: true, message: "Removed from watchlist" });
    } catch (err) {
        console.error("Delete watchlist error:", err.message);
        res.status(500).json({ success: false, message: "Server error removing from watchlist" });
    }
});

module.exports = router;

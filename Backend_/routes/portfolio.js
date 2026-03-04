const express = require("express");
const router = express.Router();
const Portfolio = require("../models/Portfolio");
const { authMiddleware } = require("../middleware/auth");

// GET /api/portfolio — list all portfolios for user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const portfolios = await Portfolio.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
        res.json({ success: true, count: portfolios.length, data: portfolios });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching portfolios" });
    }
});

// GET /api/portfolio/:id — single portfolio
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.userId });
        if (!portfolio) return res.status(404).json({ success: false, message: "Portfolio not found" });
        res.json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching portfolio" });
    }
});

// POST /api/portfolio — create a new portfolio
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, description, currency, isDefault } = req.body;

        // If isDefault, unset existing defaults
        if (isDefault) {
            await Portfolio.updateMany({ userId: req.userId }, { isDefault: false });
        }

        const portfolio = new Portfolio({
            userId: req.userId,
            name: name || "My Portfolio",
            description,
            currency: currency || "INR",
            isDefault: !!isDefault
        });
        await portfolio.save();
        res.status(201).json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error creating portfolio" });
    }
});

// POST /api/portfolio/:id/holding — add a holding
router.post("/:id/holding", authMiddleware, async (req, res) => {
    try {
        const { symbol, name, quantity, avgBuyPrice, exchange, notes } = req.body;
        if (!symbol || quantity == null || avgBuyPrice == null) {
            return res.status(400).json({ success: false, message: "symbol, quantity, avgBuyPrice are required" });
        }
        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.userId });
        if (!portfolio) return res.status(404).json({ success: false, message: "Portfolio not found" });

        portfolio.holdings.push({ symbol: symbol.toUpperCase(), name, quantity, avgBuyPrice, exchange, notes });
        portfolio.totalInvested = portfolio.holdings.reduce((s, h) => s + h.quantity * h.avgBuyPrice, 0);
        await portfolio.save();
        res.json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error adding holding" });
    }
});

// DELETE /api/portfolio/:id/holding/:holdingId — remove a holding
router.delete("/:id/holding/:holdingId", authMiddleware, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.userId });
        if (!portfolio) return res.status(404).json({ success: false, message: "Portfolio not found" });
        portfolio.holdings = portfolio.holdings.filter(h => h._id.toString() !== req.params.holdingId);
        portfolio.totalInvested = portfolio.holdings.reduce((s, h) => s + h.quantity * h.avgBuyPrice, 0);
        await portfolio.save();
        res.json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error removing holding" });
    }
});

// DELETE /api/portfolio/:id — delete entire portfolio
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        await Portfolio.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ success: true, message: "Portfolio deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting portfolio" });
    }
});

module.exports = router;

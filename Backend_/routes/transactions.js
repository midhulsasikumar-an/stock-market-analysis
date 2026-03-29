const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Portfolio = require("../models/Portfolio");
const { authMiddleware } = require("../middleware/auth");
const { canUserAccessSymbol } = require("../utils/stockVisibility");

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions for the logged-in user
 * @query   ?symbol=AAPL  — filter by symbol
 *          ?portfolioId=xxx — filter by portfolio
 *          ?type=BUY|SELL — filter by type
 *          ?limit=50 — pagination
 *          ?skip=0
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { symbol, portfolioId, type, limit = 50, skip = 0 } = req.query;
        const filter = { userId: req.userId };

        if (symbol) filter.symbol = symbol.toUpperCase();
        if (portfolioId) filter.portfolioId = portfolioId;
        if (type) filter.type = type.toUpperCase();

        const [transactions, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ executedAt: -1 })
                .limit(Number(limit))
                .skip(Number(skip)),
            Transaction.countDocuments(filter)
        ]);

        res.json({ success: true, count: transactions.length, total, data: transactions });
    } catch (err) {
        console.error("Fetch transactions error:", err.message);
        res.status(500).json({ success: false, message: "Error fetching transactions" });
    }
});

/**
 * @route   GET /api/transactions/summary/pnl
 * @desc    Get P&L summary per symbol (MUST be before /:id)
 * @access  Private
 */
router.get("/summary/pnl", authMiddleware, async (req, res) => {
    try {
        const summary = await Transaction.aggregate([
            { $match: { userId: req.userId } },
            {
                $group: {
                    _id: "$symbol",
                    totalBought: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "BUY"] }, "$totalAmount", 0]
                        }
                    },
                    totalSold: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "SELL"] }, "$totalAmount", 0]
                        }
                    },
                    totalFees: { $sum: "$fees" },
                    tradeCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    symbol: "$_id",
                    totalBought: 1,
                    totalSold: 1,
                    totalFees: 1,
                    tradeCount: 1,
                    realizedPnL: { $subtract: ["$totalSold", { $add: ["$totalBought", "$totalFees"] }] },
                    _id: 0
                }
            },
            { $sort: { tradeCount: -1 } }
        ]);
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error calculating P&L" });
    }
});

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction
 * @access  Private
 */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const tx = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
        if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });
        res.json({ success: true, data: tx });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching transaction" });
    }
});

/**
 * @route   POST /api/transactions
 * @desc    Log a new BUY or SELL transaction
 * @body    { symbol, type, quantity, pricePerUnit, portfolioId?, fees?, exchange?, notes? }
 * @access  Private
 */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { symbol, name, type, quantity, pricePerUnit, portfolioId, fees, exchange, notes, executedAt } = req.body;

        if (!symbol || !type || quantity == null || pricePerUnit == null) {
            return res.status(400).json({
                success: false,
                message: "symbol, type (BUY/SELL), quantity, and pricePerUnit are required"
            });
        }

        if (type.toUpperCase() === "BUY") {
            const canAccess = await canUserAccessSymbol(req.userId, symbol);
            if (!canAccess) {
                return res.status(403).json({ success: false, message: "This stock is currently disabled for user trading" });
            }
        }

        // Validate portfolio belongs to user if specified
        if (portfolioId) {
            const portfolio = await Portfolio.findOne({ _id: portfolioId, userId: req.userId });
            if (!portfolio) {
                return res.status(404).json({ success: false, message: "Portfolio not found" });
            }
        }

        const tx = new Transaction({
            userId: req.userId,
            portfolioId: portfolioId || null,
            symbol: symbol.toUpperCase(),
            name,
            type: type.toUpperCase(),
            quantity,
            pricePerUnit,
            fees: fees || 0,
            exchange: exchange || "US",
            notes: notes || "",
            executedAt: executedAt || new Date()
        });

        await tx.save();
        res.status(201).json({ success: true, data: tx });
    } catch (err) {
        console.error("Create transaction error:", err.message);
        res.status(500).json({ success: false, message: "Error creating transaction" });
    }
});

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction
 * @access  Private
 */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const result = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!result) return res.status(404).json({ success: false, message: "Transaction not found" });
        res.json({ success: true, message: "Transaction deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting transaction" });
    }
});

// (summary/pnl route moved above /:id — see above)

module.exports = router;

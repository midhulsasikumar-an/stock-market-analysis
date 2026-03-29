const express = require("express");
const router = express.Router();
const axios = require("axios");
const Portfolio = require("../models/Portfolio");
const Transaction = require("../models/Transaction");
const StockCache = require("../models/StockCache");
const { authMiddleware } = require("../middleware/auth");
const { canUserAccessSymbol } = require("../utils/stockVisibility");

const normalizeSymbol = (symbol) => String(symbol || "").trim().toUpperCase();

// ─── Shared: Fetch live price with cache check ─────────────────────────────
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const QUOTE_TTL = 60 * 1000; // 1 minute for portfolio view

async function fetchLivePrice(symbol) {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) return null;

    // Check MongoDB cache first
    const cacheKey = `quote:${normalizedSymbol}`;
    try {
        const cached = await StockCache.getCached(cacheKey);
        if (cached && cached.c) return { price: cached.c, change: cached.d, changePercent: cached.dp };
    } catch (e) { /* cache miss */ }

    // Fetch from Finnhub
    try {
        const { data } = await axios.get("https://finnhub.io/api/v1/quote", {
            params: { symbol: normalizedSymbol, token: FINNHUB_KEY },
            timeout: 8000
        });
        if (data && data.c) {
            await StockCache.setCached(cacheKey, data, "quote", QUOTE_TTL).catch(() => { });
            return { price: data.c, change: data.d, changePercent: data.dp };
        }
    } catch (e) { /* API failed */ }

    return null;
}

// ─── GET /api/portfolio — list all portfolios ────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
    try {
        const portfolios = await Portfolio.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
        res.json({ success: true, count: portfolios.length, data: portfolios });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching portfolios" });
    }
});

// ─── GET /api/portfolio/summary — Full enriched portfolio with live prices ───
// Returns holdings with current prices, P&L, sector allocation, recent transactions
router.get("/summary", authMiddleware, async (req, res) => {
    try {
        // Get or create default portfolio
        let portfolio = await Portfolio.findOne({ userId: req.userId, isDefault: true });
        if (!portfolio) {
            portfolio = await Portfolio.findOne({ userId: req.userId });
        }
        if (!portfolio) {
            // Auto-create a default portfolio
            portfolio = await Portfolio.create({
                userId: req.userId,
                name: "My Portfolio",
                isDefault: true
            });
        }

        // Fetch live prices for all holdings in parallel
        const holdings = portfolio.holdings || [];
        const uniqueSymbols = [...new Set(holdings.map(h => normalizeSymbol(h.symbol)).filter(Boolean))];

        const priceMap = {};
        await Promise.allSettled(
            uniqueSymbols.map(async (symbol) => {
                const result = await fetchLivePrice(symbol);
                if (result) priceMap[symbol] = result;
            })
        );

        // Enrich each holding with P&L calculations
        const enrichedHoldings = holdings.map(h => {
            const symbol = normalizeSymbol(h.symbol);
            const live = priceMap[symbol];
            const currentPrice = live?.price ?? h.currentPrice ?? h.avgBuyPrice;
            const invested = h.quantity * h.avgBuyPrice;
            const currentValue = h.quantity * currentPrice;
            const profitLoss = currentValue - invested;
            const profitLossPct = invested > 0 ? (profitLoss / invested) * 100 : 0;

            if (symbol === "GOOGL") {
                console.log("GOOGL pnl calc:", {
                    currentPrice,
                    avgBuyPrice: h.avgBuyPrice,
                    quantity: h.quantity,
                    livePrice: live?.price ?? null,
                    fallbackUsed: live?.price == null && h.currentPrice == null
                });
            }

            return {
                _id: h._id,
                symbol,
                name: h.name || h.symbol,
                quantity: h.quantity,
                avgBuyPrice: h.avgBuyPrice,
                currentPrice,
                dayChange: live?.change ?? 0,
                dayChangePct: live?.changePercent ?? 0,
                invested,
                currentValue,
                profitLoss,
                profitLossPct,
                sector: h.sector || "Other",
                exchange: h.exchange || "US",
                buyDate: h.buyDate
            };
        });

        // Portfolio-level aggregations
        const totalInvested = enrichedHoldings.reduce((sum, h) => sum + h.invested, 0);
        const totalCurrentValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
        const totalProfitLoss = totalCurrentValue - totalInvested;
        const totalReturnPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
        const todayChange = enrichedHoldings.reduce((sum, h) => sum + (h.dayChange * h.quantity), 0);
        const todayChangePct = totalCurrentValue > 0 ? (todayChange / (totalCurrentValue - todayChange)) * 100 : 0;

        // Sector allocation
        const sectorMap = {};
        enrichedHoldings.forEach(h => {
            sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.currentValue;
        });
        const sectorAllocation = Object.entries(sectorMap)
            .map(([name, value]) => ({
                name,
                value,
                percent: totalCurrentValue > 0 ? ((value / totalCurrentValue) * 100).toFixed(2) : "0"
            }))
            .sort((a, b) => b.value - a.value);

        // Top gainers/losers
        const sorted = [...enrichedHoldings].sort((a, b) => b.profitLossPct - a.profitLossPct);
        const topGainers = sorted.filter(h => h.profitLoss >= 0).slice(0, 3);
        const topLosers = sorted.filter(h => h.profitLoss < 0).slice(0, 3);

        // Recent transactions (last 10)
        const recentTransactions = await Transaction.find({ userId: req.userId, portfolioId: portfolio._id })
            .sort({ executedAt: -1 })
            .limit(10)
            .lean();

        res.json({
            success: true,
            data: {
                portfolio: {
                    _id: portfolio._id,
                    name: portfolio.name,
                    currency: portfolio.currency
                },
                summary: {
                    totalInvested,
                    totalCurrentValue,
                    totalProfitLoss,
                    totalReturnPct,
                    todayChange,
                    todayChangePct,
                    holdingsCount: enrichedHoldings.length
                },
                holdings: enrichedHoldings,
                sectorAllocation,
                topGainers,
                topLosers,
                recentTransactions
            }
        });
    } catch (err) {
        console.error("Portfolio summary error:", err.message);
        res.status(500).json({ success: false, message: "Error fetching portfolio summary" });
    }
});

// ─── GET /api/portfolio/:id — single portfolio ──────────────────────────────
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.userId });
        if (!portfolio) return res.status(404).json({ success: false, message: "Portfolio not found" });
        res.json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching portfolio" });
    }
});

// ─── POST /api/portfolio — create a new portfolio ───────────────────────────
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, description, currency, isDefault } = req.body;
        if (isDefault) {
            await Portfolio.updateMany({ userId: req.userId }, { isDefault: false });
        }
        const portfolio = new Portfolio({
            userId: req.userId,
            name: name || "My Portfolio",
            description,
            currency: currency || "USD",
            isDefault: !!isDefault
        });
        await portfolio.save();
        res.status(201).json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error creating portfolio" });
    }
});

// ─── POST /api/portfolio/:id/holding — add a holding ────────────────────────
router.post("/:id/holding", authMiddleware, async (req, res) => {
    try {
        const { symbol, name, quantity, avgBuyPrice, exchange, sector, notes } = req.body;
        if (!symbol || quantity == null || avgBuyPrice == null) {
            return res.status(400).json({ success: false, message: "symbol, quantity, avgBuyPrice are required" });
        }
        const normalizedSymbol = normalizeSymbol(symbol);
        if (quantity <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be positive" });
        }
        const canAccess = await canUserAccessSymbol(req.userId, normalizedSymbol);
        if (!canAccess) {
            return res.status(403).json({ success: false, message: "This stock is currently disabled for user trading" });
        }

        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.userId });
        if (!portfolio) return res.status(404).json({ success: false, message: "Portfolio not found" });

        // Check if symbol already exists — merge (average up/down)
        const existing = portfolio.holdings.find(h => normalizeSymbol(h.symbol) === normalizedSymbol);
        if (existing) {
            const totalQty = existing.quantity + quantity;
            const totalCost = (existing.quantity * existing.avgBuyPrice) + (quantity * avgBuyPrice);
            existing.quantity = totalQty;
            existing.avgBuyPrice = totalCost / totalQty;
            if (sector) existing.sector = sector;
            if (notes) existing.notes = notes;
        } else {
            portfolio.holdings.push({
                symbol: normalizedSymbol,
                name,
                quantity,
                avgBuyPrice,
                exchange: exchange || "US",
                sector: sector || "",
                notes
            });
        }

        await portfolio.save();

        // Also log as a transaction
        await Transaction.create({
            userId: req.userId,
            portfolioId: portfolio._id,
            symbol: normalizedSymbol,
            name,
            type: "BUY",
            quantity,
            pricePerUnit: avgBuyPrice,
            exchange: exchange || "US",
            notes
        });

        res.json({ success: true, data: portfolio });
    } catch (err) {
        console.error("Add holding error:", err.message);
        res.status(500).json({ success: false, message: "Error adding holding" });
    }
});

// ─── POST /api/portfolio/:id/sell — sell a holding ──────────────────────────
router.post("/:id/sell", authMiddleware, async (req, res) => {
    try {
        const { symbol, quantity, pricePerUnit, notes } = req.body;
        if (!symbol || quantity == null || pricePerUnit == null) {
            return res.status(400).json({ success: false, message: "symbol, quantity, pricePerUnit are required" });
        }
        const normalizedSymbol = normalizeSymbol(symbol);

        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.userId });
        if (!portfolio) return res.status(404).json({ success: false, message: "Portfolio not found" });

        const holding = portfolio.holdings.find(h => normalizeSymbol(h.symbol) === normalizedSymbol);
        if (!holding) return res.status(400).json({ success: false, message: "Stock not found in portfolio" });
        if (holding.quantity < quantity) {
            return res.status(400).json({ success: false, message: `Insufficient quantity. You hold ${holding.quantity} shares.` });
        }

        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            portfolio.holdings = portfolio.holdings.filter(h => normalizeSymbol(h.symbol) !== normalizedSymbol);
        }

        await portfolio.save();

        // Log as a sell transaction
        await Transaction.create({
            userId: req.userId,
            portfolioId: portfolio._id,
            symbol: normalizedSymbol,
            type: "SELL",
            quantity,
            pricePerUnit,
            notes
        });

        res.json({ success: true, data: portfolio });
    } catch (err) {
        console.error("Sell holding error:", err.message);
        res.status(500).json({ success: false, message: "Error selling holding" });
    }
});

// ─── DELETE /api/portfolio/:id/holding/:holdingId — remove a holding ─────────
router.delete("/:id/holding/:holdingId", authMiddleware, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.userId });
        if (!portfolio) return res.status(404).json({ success: false, message: "Portfolio not found" });
        portfolio.holdings = portfolio.holdings.filter(h => h._id.toString() !== req.params.holdingId);
        await portfolio.save();
        res.json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error removing holding" });
    }
});

// ─── DELETE /api/portfolio/:id — delete entire portfolio ────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        await Portfolio.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ success: true, message: "Portfolio deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting portfolio" });
    }
});

module.exports = router;

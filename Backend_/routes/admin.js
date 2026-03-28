const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");
const Transaction = require("../models/Transaction");
const Alert = require("../models/Alert");
const UserSettings = require("../models/UserSettings");
const SearchHistory = require("../models/SearchHistory");
const Notification = require("../models/Notification");
const WatchlistUser = require("../models/WatchlistUser");
const AdminActivityLog = require("../models/AdminActivityLog");
const AdminPlatformSetting = require("../models/AdminPlatformSetting");
const AdminStockVisibility = require("../models/AdminStockVisibility");
const PriceCache = require("../models/PriceCache");
const { getCachedPrices } = require("../utils/priceCache");
const { logAdminAction } = require("../utils/logAdminAction");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const finnhubClient = axios.create({
    baseURL: "https://finnhub.io/api/v1",
    timeout: 10000
});
const FINNHUB_LATENCY_HISTORY_MAX = 500;
const finnhubLatencyHistory = [];

router.use(authMiddleware);
router.use(adminMiddleware);

function getDateFrom(period) {
    const now = new Date();
    switch (period) {
        case "1D": return new Date(now - 24 * 60 * 60 * 1000);
        case "1W": return new Date(now - 7 * 24 * 60 * 60 * 1000);
        case "1M": return new Date(now - 30 * 24 * 60 * 60 * 1000);
        case "6M": return new Date(now - 180 * 24 * 60 * 60 * 1000);
        case "1Y": return new Date(now - 365 * 24 * 60 * 60 * 1000);
        case "ALL": return null;
        default: return null;
    }
}

function getGroupFormat(period) {
    switch (period) {
        case "1D": return "%H:00";
        case "1W": return "%m-%d";
        case "1M": return "%m-%d";
        case "6M": return "%Y-%m";
        case "1Y": return "%Y-%m";
        case "ALL": return "%Y-%m";
        default: return "%Y-%m";
    }
}

function recordFinnhubLatency(latency) {
    const value = Number(latency);
    if (!Number.isFinite(value) || value < 0) return;

    finnhubLatencyHistory.push({
        timestamp: new Date().toISOString(),
        latency: value
    });

    if (finnhubLatencyHistory.length > FINNHUB_LATENCY_HISTORY_MAX) {
        finnhubLatencyHistory.splice(0, finnhubLatencyHistory.length - FINNHUB_LATENCY_HISTORY_MAX);
    }
}

function formatUptime(seconds) {
    const safeSeconds = Math.max(Math.floor(Number(seconds) || 0), 0);
    const d = Math.floor(safeSeconds / 86400);
    const h = Math.floor((safeSeconds % 86400) / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    const s = Math.floor(safeSeconds % 60);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

async function logAdminActivity({ actorId, action, entityType, entityId = "", description, severity = "info", metadata = {} }) {
    try {
        await AdminActivityLog.create({
            actorId,
            action,
            entityType,
            entityId,
            description,
            severity,
            metadata
        });
    } catch (error) {
        console.error("Admin activity log error:", error.message);
    }
}

async function getPlatformSettings() {
    return AdminPlatformSetting.findOneAndUpdate(
        { key: "platform" },
        {
            $setOnInsert: { key: "platform" },
            $unset: {
                maxTradeValue: "",
                maxDailyTrades: ""
            }
        },
        { upsert: true, new: true }
    );
}

async function getInvestmentSummary() {
    const portfolioAgg = await Portfolio.aggregate([
        { $unwind: { path: "$holdings", preserveNullAndEmptyArrays: false } },
        {
            $group: {
                _id: null,
                totalInvestment: { $sum: { $multiply: ["$holdings.quantity", "$holdings.avgBuyPrice"] } },
                totalCurrentValue: {
                    $sum: {
                        $multiply: [
                            "$holdings.quantity",
                            { $ifNull: ["$holdings.currentPrice", "$holdings.avgBuyPrice"] }
                        ]
                    }
                }
            }
        }
    ]);

    const totalInvestment = portfolioAgg[0]?.totalInvestment || 0;
    const totalCurrentValue = portfolioAgg[0]?.totalCurrentValue || 0;

    return {
        totalInvestment,
        totalCurrentValue,
        totalProfitLoss: totalCurrentValue - totalInvestment
    };
}

async function getPlatformPnLSummary() {
    const portfolios = await Portfolio.find({ "holdings.0": { $exists: true } })
        .select("holdings")
        .lean();

    const holdings = portfolios.flatMap((portfolio) => portfolio.holdings || []);
    console.log('[AdminStats] Holdings found:', holdings.length);
    if (!holdings.length) {
        return {
            totalPnL: 0,
            pnlStatus: "live",
            lastPriceUpdate: null,
            totalHoldings: 0,
            pricedHoldings: 0,
            unpricedHoldings: 0
        };
    }

    const uniqueSymbols = [...new Set(
        holdings
            .map((holding) => (holding.symbol || "").toUpperCase().trim())
            .filter(Boolean)
    )];
    console.log('[AdminStats] Unique symbols:', uniqueSymbols);

    const prices = await getCachedPrices(uniqueSymbols, finnhubClient);
    console.log('[AdminStats] Prices returned:', prices);

    let totalPnL = 0;
    let pricedHoldings = 0;

    holdings.forEach((holding) => {
        const symbol = (holding.symbol || "").toUpperCase().trim();
        const quantity = Number(holding.quantity) || 0;
        const buyPrice = Number(holding.avgBuyPrice) || 0;
        const currentPrice = prices[symbol];

        if (!symbol || quantity <= 0 || buyPrice < 0) {
            return;
        }

        if (typeof currentPrice === "number" && Number.isFinite(currentPrice) && currentPrice > 0) {
            totalPnL += (currentPrice - buyPrice) * quantity;
            pricedHoldings += 1;
        }
    });

    const totalHoldings = holdings.filter((holding) => Number(holding.quantity) > 0).length;
    const unpricedHoldings = Math.max(totalHoldings - pricedHoldings, 0);
    const lastUpdatedEntry = await PriceCache.findOne().sort({ lastUpdated: -1 }).select("lastUpdated").lean();
    console.log('[AdminStats] Calculated P&L:', totalPnL);

    return {
        totalPnL,
        totalProfitLoss: totalPnL,
        pnlStatus: "live",
        lastPriceUpdate: lastUpdatedEntry?.lastUpdated || null,
        totalHoldings,
        pricedHoldings,
        unpricedHoldings
    };
}

async function getUserPortfolioValueMap() {
    const portfolioValues = await Portfolio.aggregate([
        { $unwind: { path: "$holdings", preserveNullAndEmptyArrays: false } },
        {
            $group: {
                _id: "$userId",
                portfolioValue: {
                    $sum: {
                        $multiply: [
                            "$holdings.quantity",
                            { $ifNull: ["$holdings.currentPrice", "$holdings.avgBuyPrice"] }
                        ]
                    }
                }
            }
        }
    ]);

    return portfolioValues.reduce((acc, item) => {
        acc[item._id.toString()] = item.portfolioValue;
        return acc;
    }, {});
}

async function getTransactionCountMap() {
    const txCounts = await Transaction.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]);

    return txCounts.reduce((acc, item) => {
        acc[item._id.toString()] = item.count;
        return acc;
    }, {});
}

function buildDateRangeFilter(startDate, endDate) {
    const normalizedStart = typeof startDate === "string" ? startDate.trim() : startDate;
    const normalizedEnd = typeof endDate === "string" ? endDate.trim() : endDate;

    const isMissing = (value) => !value || value === "undefined" || value === "null";
    if (isMissing(normalizedStart) && isMissing(normalizedEnd)) return undefined;

    const range = {};
    if (!isMissing(normalizedStart)) {
        const start = new Date(normalizedStart);
        if (!Number.isNaN(start.getTime())) {
            range.$gte = start;
        }
    }

    if (!isMissing(normalizedEnd)) {
        const end = new Date(normalizedEnd);
        if (Number.isNaN(end.getTime())) {
            return Object.keys(range).length ? range : undefined;
        }
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
    }

    return Object.keys(range).length ? range : undefined;
}

async function getActivityTimeline(days) {
    const safeDays = Math.min(Math.max(parseInt(days, 10) || 30, 1), 90);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (safeDays - 1));

    const aggregated = await Transaction.aggregate([
        { $match: { executedAt: { $gte: start } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$executedAt" } },
                tradeEntries: { $sum: 1 },
                users: { $addToSet: "$userId" }
            }
        },
        {
            $project: {
                _id: 1,
                tradeEntries: 1,
                activeUsers: { $size: "$users" }
            }
        }
    ]);

    const map = aggregated.reduce((acc, row) => {
        acc[row._id] = {
            activeUsers: Number(row.activeUsers) || 0,
            tradeEntries: Number(row.tradeEntries) || 0
        };
        return acc;
    }, {});

    const timeline = [];
    for (let i = 0; i < safeDays; i += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const isoDay = date.toISOString().slice(0, 10);
        const row = map[isoDay] || { activeUsers: 0, tradeEntries: 0 };

        timeline.push({
            date: isoDay,
            label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            activeUsers: row.activeUsers,
            tradeEntries: row.tradeEntries
        });
    }

    return { days: safeDays, timeline };
}

async function fetchFinnhubSymbols(exchange) {
    if (!FINNHUB_KEY) {
        throw new Error("Finnhub API key is not configured");
    }

    const { data } = await finnhubClient.get("/stock/symbol", {
        params: { exchange, token: FINNHUB_KEY }
    });

    return (Array.isArray(data) ? data : [])
        .filter((item) => item.type === "Common Stock" && item.symbol && !item.symbol.includes("."))
        .map((item) => ({
            symbol: item.symbol,
            companyName: item.description || item.displaySymbol || item.symbol,
            market: item.mic || item.currency || exchange,
            exchange: item.exchange || exchange
        }));
}

router.get("/dashboard", async (req, res) => {
    try {
        const [totalUsers, totalTransactions, activeAlerts, investmentSummary, pnlSummary] = await Promise.all([
            User.countDocuments(),
            Transaction.countDocuments(),
            Alert.countDocuments({ isActive: true }).catch(() => 0),
            getInvestmentSummary(),
            getPlatformPnLSummary()
        ]);

        const activePortfolios = await Portfolio.countDocuments({ "holdings.0": { $exists: true } });

        const recentTransactions = await Transaction.find()
            .populate("userId", "username email")
            .sort({ executedAt: -1 })
            .limit(10)
            .lean();

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const chartDataRaw = await Transaction.aggregate([
            { $match: { executedAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%m-%d", date: "$executedAt" } },
                    count: { $sum: 1 },
                    volume: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const apiCallsToday = await Transaction.countDocuments({ executedAt: { $gte: todayStart } });

        return res.json({
            success: true,
            data: {
                totalUsers,
                totalTransactions,
                totalPortfolios: activePortfolios,
                activeAlerts,
                totalInvestment: investmentSummary.totalInvestment,
                totalProfitLoss: pnlSummary.totalPnL,
                totalPnL: pnlSummary.totalPnL,
                pnlStatus: pnlSummary.pnlStatus,
                lastPriceUpdate: pnlSummary.lastPriceUpdate,
                pnlCoverage: {
                    totalHoldings: pnlSummary.totalHoldings,
                    pricedHoldings: pnlSummary.pricedHoldings,
                    unpricedHoldings: pnlSummary.unpricedHoldings,
                    isComplete: pnlSummary.unpricedHoldings === 0
                },
                recentTransactions,
                chartData: chartDataRaw,
                apiCallsToday
            }
        });
    } catch (error) {
        console.error("Admin dashboard error:", error.message);
        return res.status(500).json({ success: false, message: "Server error fetching dashboard" });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const [totalUsers, totalTransactions, investmentSummary, pnlSummary] = await Promise.all([
            User.countDocuments(),
            Transaction.countDocuments(),
            getInvestmentSummary(),
            getPlatformPnLSummary()
        ]);

        const activePortfolios = await Portfolio.countDocuments({ "holdings.0": { $exists: true } });

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const [newUsersThisWeek, newUsersLastWeek, txThisWeek, txLastWeek] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
            User.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } }),
            Transaction.countDocuments({ executedAt: { $gte: oneWeekAgo } }),
            Transaction.countDocuments({ executedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } })
        ]);

        const userGrowth = newUsersLastWeek > 0
            ? (((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100).toFixed(1)
            : newUsersThisWeek > 0 ? "100" : "0";
        const txGrowth = txLastWeek > 0
            ? (((txThisWeek - txLastWeek) / txLastWeek) * 100).toFixed(1)
            : txThisWeek > 0 ? "100" : "0";

        return res.json({
            success: true,
            data: {
                totalUsers,
                activePortfolios,
                totalTransactions,
                totalInvestment: investmentSummary.totalInvestment,
                totalProfitLoss: pnlSummary.totalPnL,
                totalPnL: pnlSummary.totalPnL,
                pnlStatus: pnlSummary.pnlStatus,
                lastPriceUpdate: pnlSummary.lastPriceUpdate,
                pnlCoverage: {
                    totalHoldings: pnlSummary.totalHoldings,
                    pricedHoldings: pnlSummary.pricedHoldings,
                    unpricedHoldings: pnlSummary.unpricedHoldings,
                    isComplete: pnlSummary.unpricedHoldings === 0
                },
                trends: {
                    userGrowth: Number(userGrowth),
                    userTrendUp: Number(userGrowth) >= 0,
                    txGrowth: Number(txGrowth),
                    txTrendUp: Number(txGrowth) >= 0
                }
            }
        });
    } catch (error) {
        console.error("Admin stats error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching stats" });
    }
});

router.get("/chart", async (req, res) => {
    try {
        const period = req.query.period || "ALL";
        const from = typeof req.query.from === "string" ? req.query.from.trim() : "";
        const to = typeof req.query.to === "string" ? req.query.to.trim() : "";
        const groupFmt = getGroupFormat(period);

        let dateFilter = null;
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
                dateFilter = { executedAt: { $gte: fromDate, $lte: toDate } };
            }
        }

        if (!dateFilter) {
            const fallbackFrom = getDateFrom(period);
            if (fallbackFrom) {
                dateFilter = { executedAt: { $gte: fallbackFrom, $lte: new Date() } };
            }
        }

        const matchStage = dateFilter ? { $match: dateFilter } : { $match: {} };

        const chartRaw = await Transaction.aggregate([
            matchStage,
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: groupFmt, date: "$executedAt" } },
                        type: "$type"
                    },
                    count: { $sum: 1 },
                    volume: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        const bucketMap = {};
        chartRaw.forEach((row) => {
            const key = row._id.date;
            if (!bucketMap[key]) bucketMap[key] = { label: key, buy: 0, sell: 0, volume: 0 };
            if (row._id.type === "BUY") bucketMap[key].buy += row.count;
            if (row._id.type === "SELL") bucketMap[key].sell += row.count;
            bucketMap[key].volume += row.volume;
        });

        return res.json({
            success: true,
            data: Object.values(bucketMap).sort((a, b) => a.label.localeCompare(b.label)),
            period
        });
    } catch (error) {
        console.error("Admin chart error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching chart data" });
    }
});

router.get("/system-health", async (req, res) => {
    const startedAt = Date.now();

    try {
        const mongoProbeStart = Date.now();
        await mongoose.connection.db.admin().ping();
        const mongoLatency = Date.now() - mongoProbeStart;
        const mongoState = mongoose.connection.readyState;
        const mongoStatus = mongoState === 1 ? "Online" : mongoState === 2 ? "Connecting" : "Offline";

        let finnhubStatus = "No API Key";
        let finnhubLatency = null;
        if (FINNHUB_KEY) {
            try {
                const finnhubStart = Date.now();
                await finnhubClient.get("/quote", {
                    params: { symbol: "AAPL", token: FINNHUB_KEY }
                });
                finnhubLatency = Date.now() - finnhubStart;
                finnhubStatus = "Connected";
                recordFinnhubLatency(finnhubLatency);
            } catch (error) {
                finnhubStatus = "Failed";
            }
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const [transactionsToday, averageTradeValueAgg, activeUsers30d] = await Promise.all([
            Transaction.countDocuments({ executedAt: { $gte: todayStart } }).catch(() => 0),
            Transaction.aggregate([
                { $group: { _id: null, averageTradeValue: { $avg: "$totalAmount" } } }
            ]),
            Transaction.distinct("userId", { executedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
        ]);

        const uptimeSeconds = Math.floor(process.uptime());
        const uptimeFormatted = formatUptime(uptimeSeconds);

        const responseLatency = Date.now() - startedAt;

        return res.json({
            success: true,
            data: {
                mongo: { status: mongoStatus, latency: mongoLatency },
                express: {
                    status: "Active",
                    uptime: uptimeSeconds,
                    uptimeSeconds,
                    uptimeFormatted,
                    startedAt: null
                },
                finnhub: { status: finnhubStatus, latency: finnhubLatency, requestsToday: transactionsToday },
                metrics: {
                    responseLatency,
                    averageTradeValue: averageTradeValueAgg[0]?.averageTradeValue || 0,
                    activeUsers30d: activeUsers30d.length,
                    serverTime: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error("Admin system health error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching system health" });
    }
});

router.get("/health/latency-history", async (req, res) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 30);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const data = finnhubLatencyHistory
            .filter((entry) => {
                const ts = new Date(entry.timestamp);
                return !Number.isNaN(ts.getTime()) && ts >= cutoff;
            })
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return res.json({ success: true, data, meta: { days, total: data.length } });
    } catch (error) {
        console.error("Admin latency history error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching latency history" });
    }
});

router.get("/recent-users", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
        const users = await User.find()
            .select("username email createdAt accountStatus role")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return res.json({ success: true, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching recent users" });
    }
});

router.get("/activity-log", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const type = req.query.type || "all";
        const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate.trim() : "";
        const toDate = typeof req.query.toDate === "string" ? req.query.toDate.trim() : "";

        const parsedFrom = fromDate ? new Date(fromDate) : null;
        const parsedTo = toDate ? new Date(toDate) : null;
        const hasFrom = parsedFrom && !Number.isNaN(parsedFrom.getTime());
        const hasTo = parsedTo && !Number.isNaN(parsedTo.getTime());
        if (hasTo) parsedTo.setHours(23, 59, 59, 999);

        const [tradeEvents, registrations, adminActions] = await Promise.all([
            Transaction.find()
                .populate("userId", "username email")
                .sort({ executedAt: -1 })
                .limit(limit * 2)
                .lean(),
            User.find()
                .select("username email createdAt role")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(),
            AdminActivityLog.find()
                .populate("actorId", "username email")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean()
        ]);

        const logs = [
            ...tradeEvents.map((tx) => ({
                _id: `trade-${tx._id}`,
                category: "trade",
                type: tx.type,
                severity: tx.type === "BUY" ? "info" : "warning",
                actor: tx.userId?.username || "Unknown",
                message: `${tx.userId?.username || "User"} ${tx.type === "BUY" ? "bought" : "sold"} ${tx.quantity} x ${tx.symbol} for $${(tx.totalAmount || 0).toFixed(2)}`,
                timestamp: tx.executedAt || tx.createdAt,
                metadata: { symbol: tx.symbol, totalAmount: tx.totalAmount }
            })),
            ...registrations.map((user) => ({
                _id: `registration-${user._id}`,
                category: "registration",
                type: "REGISTER",
                severity: "info",
                actor: user.username,
                message: `${user.username} registered a new ${user.role === "admin" ? "admin" : "user"} account`,
                timestamp: user.createdAt,
                metadata: { email: user.email }
            })),
            ...adminActions.map((log) => ({
                _id: `admin-${log._id}`,
                category: log.category || "admin",
                type: log.action,
                severity: log.severity,
                actor: log.actorId?.username || log.actorId?.email || "Admin",
                message: log.description,
                timestamp: log.createdAt,
                metadata: log.metadata || {}
            }))
        ]
            .filter((item) => {
                if (!hasFrom && !hasTo) return true;
                const ts = new Date(item.timestamp);
                if (Number.isNaN(ts.getTime())) return false;
                if (hasFrom && ts < parsedFrom) return false;
                if (hasTo && ts > parsedTo) return false;
                return true;
            })
            .filter((item) => type === "all" || item.category === type)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        return res.json({ success: true, data: logs });
    } catch (error) {
        console.error("Admin activity log error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching activity log" });
    }
});

router.get("/users", async (req, res) => {
    try {
        const search = (req.query.search || "").trim().toLowerCase();
        const users = await User.find()
            .select("-password -passwordResetToken -emailVerificationToken -refreshTokenHash")
            .sort({ createdAt: -1 })
            .lean();

        const [portfolioValueMap, transactionCountMap] = await Promise.all([
            getUserPortfolioValueMap(),
            getTransactionCountMap()
        ]);

        const enriched = users
            .map((user) => {
                const combinedName = [user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                const emailPrefix = typeof user.email === "string" ? user.email.split("@")[0] : "";
                const resolvedName = user.username
                    || user.name
                    || user.displayName
                    || user.fullName
                    || combinedName
                    || emailPrefix
                    || "Unknown User";

                return {
                    ...user,
                    username: resolvedName,
                    name: resolvedName,
                    displayName: resolvedName,
                    fullName: combinedName || resolvedName,
                    portfolioValue: portfolioValueMap[user._id.toString()] || 0,
                    transactionCount: transactionCountMap[user._id.toString()] || 0
                };
            })
            .filter((user) => {
                if (!search) return true;
                return user.username?.toLowerCase().includes(search)
                    || user.displayName?.toLowerCase().includes(search)
                    || user.fullName?.toLowerCase().includes(search)
                    || user.email?.toLowerCase().includes(search);
            });

        return res.json({ success: true, data: enriched });
    } catch (error) {
        console.error("Admin users error:", error.message);
        return res.status(500).json({ success: false, message: "Server error fetching users" });
    }
});

router.get("/transactions", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 250);
        const page = parseInt(req.query.page, 10) || 1;
        const skip = (page - 1) * limit;
        const query = {};

        const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
        const symbol = typeof req.query.symbol === "string" ? req.query.symbol.trim().toUpperCase() : "";
        const type = typeof req.query.type === "string" ? req.query.type.trim().toUpperCase() : "";

        if (userId && userId !== "undefined" && userId !== "null" && mongoose.Types.ObjectId.isValid(userId)) {
            query.userId = userId;
        }
        if (symbol && symbol !== "UNDEFINED" && symbol !== "NULL") {
            query.symbol = symbol;
        }
        if (type && ["BUY", "SELL"].includes(type)) {
            query.type = type;
        }

        const dateRange = buildDateRangeFilter(req.query.startDate, req.query.endDate);
        if (dateRange) query.executedAt = dateRange;

        const [transactions, total, totalsAgg] = await Promise.all([
            Transaction.find(query)
                .populate("userId", "username email")
                .sort({ executedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments(query),
            Transaction.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalVolume: { $sum: "$totalAmount" },
                        buyCount: {
                            $sum: {
                                $cond: [{ $eq: ["$type", "BUY"] }, 1, 0]
                            }
                        },
                        sellCount: {
                            $sum: {
                                $cond: [{ $eq: ["$type", "SELL"] }, 1, 0]
                            }
                        }
                    }
                }
            ])
        ]);

        return res.json({
            success: true,
            data: transactions,
            pagination: { total, page, pages: Math.ceil(total / limit) || 1 },
            summary: totalsAgg[0] || { totalVolume: 0, buyCount: 0, sellCount: 0 }
        });
    } catch (error) {
        console.error("Admin transactions error:", error.message);
        return res.status(500).json({ success: false, message: "Server error fetching transactions" });
    }
});

router.get("/portfolio-inspector/:userId", async (req, res) => {
    try {
        const [user, portfolios] = await Promise.all([
            User.findById(req.params.userId).select("username email role accountStatus createdAt").lean(),
            Portfolio.find({ userId: req.params.userId }).sort({ isDefault: -1, createdAt: -1 }).lean()
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const holdingsMap = {};
        portfolios.forEach((portfolio) => {
            (portfolio.holdings || []).forEach((holding) => {
                const key = holding.symbol;
                if (!holdingsMap[key]) {
                    holdingsMap[key] = {
                        symbol: holding.symbol,
                        name: holding.name || holding.symbol,
                        quantity: 0,
                        totalCost: 0,
                        currentValue: 0,
                        averagePrice: 0,
                        currentPrice: holding.currentPrice ?? holding.avgBuyPrice,
                        portfolios: new Set()
                    };
                }

                holdingsMap[key].quantity += holding.quantity;
                holdingsMap[key].totalCost += holding.quantity * holding.avgBuyPrice;
                holdingsMap[key].currentValue += holding.quantity * (holding.currentPrice ?? holding.avgBuyPrice);
                holdingsMap[key].currentPrice = holding.currentPrice ?? holdingsMap[key].currentPrice;
                holdingsMap[key].portfolios.add(portfolio.name);
            });
        });

        const holdings = Object.values(holdingsMap).map((holding) => ({
            symbol: holding.symbol,
            name: holding.name,
            quantity: holding.quantity,
            averagePrice: holding.quantity > 0 ? holding.totalCost / holding.quantity : 0,
            currentPrice: holding.currentPrice,
            currentValue: holding.currentValue,
            gainLoss: holding.currentValue - holding.totalCost,
            portfolios: Array.from(holding.portfolios)
        })).sort((a, b) => b.currentValue - a.currentValue);

        const totals = holdings.reduce((acc, holding) => {
            acc.totalCost += holding.quantity * holding.averagePrice;
            acc.currentValue += holding.currentValue;
            return acc;
        }, { totalCost: 0, currentValue: 0 });

        return res.json({
            success: true,
            data: {
                user,
                portfolios: portfolios.map((portfolio) => ({
                    _id: portfolio._id,
                    name: portfolio.name,
                    holdingsCount: portfolio.holdings?.length || 0,
                    isDefault: portfolio.isDefault
                })),
                holdings,
                summary: {
                    portfolios: portfolios.length,
                    holdings: holdings.length,
                    totalCost: totals.totalCost,
                    currentValue: totals.currentValue,
                    totalGainLoss: totals.currentValue - totals.totalCost
                }
            }
        });
    } catch (error) {
        console.error("Portfolio inspector error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching portfolio data" });
    }
});

router.get("/analytics", async (req, res) => {
    try {
        const period = req.query.period || "6M";
        const dateFrom = getDateFrom(period);
        const transactionMatch = dateFrom ? { executedAt: { $gte: dateFrom } } : {};
        const userMatch = dateFrom ? { createdAt: { $gte: dateFrom } } : {};

        const [topStocks, tradingVolume, userGrowth, activePortfolios, investmentSummary, enabledStocks, totalTransactions] = await Promise.all([
            Transaction.aggregate([
                { $match: transactionMatch },
                {
                    $group: {
                        _id: "$symbol",
                        trades: { $sum: 1 },
                        volume: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { trades: -1, volume: -1 } },
                { $limit: 8 }
            ]),
            Transaction.aggregate([
                { $match: transactionMatch },
                {
                    $group: {
                        _id: {
                            label: { $dateToString: { format: getGroupFormat(period), date: "$executedAt" } },
                            type: "$type"
                        },
                        volume: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id.label": 1 } }
            ]),
            User.aggregate([
                { $match: userMatch },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        users: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Portfolio.countDocuments({ "holdings.0": { $exists: true } }),
            getInvestmentSummary(),
            AdminStockVisibility.countDocuments({ isEnabled: true }),
            Transaction.countDocuments(transactionMatch)
        ]);

        const volumeBuckets = {};
        tradingVolume.forEach((item) => {
            const label = item._id.label;
            if (!volumeBuckets[label]) {
                volumeBuckets[label] = { label, buyVolume: 0, sellVolume: 0, totalVolume: 0 };
            }
            if (item._id.type === "BUY") volumeBuckets[label].buyVolume = item.volume;
            if (item._id.type === "SELL") volumeBuckets[label].sellVolume = item.volume;
            volumeBuckets[label].totalVolume += item.volume;
        });

        const activeUsers30d = await Transaction.distinct(
            "userId",
            { executedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        );

        return res.json({
            success: true,
            data: {
                topStocks: topStocks.map((item) => ({
                    symbol: item._id,
                    trades: item.trades,
                    volume: item.volume
                })),
                tradingVolume: Object.values(volumeBuckets),
                userGrowth: userGrowth.map((item) => ({ label: item._id, users: item.users })),
                platformStats: {
                    activeUsers30d: activeUsers30d.length,
                    activePortfolios,
                    totalInvestment: investmentSummary.totalInvestment,
                    totalProfitLoss: investmentSummary.totalProfitLoss,
                    totalTransactions,
                    enabledStocks
                }
            }
        });
    } catch (error) {
        console.error("Admin analytics error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching analytics" });
    }
});

router.get("/analytics/activity", async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const activity = await getActivityTimeline(days);
        return res.json({ success: true, data: activity.timeline, meta: { days: activity.days } });
    } catch (error) {
        console.error("Admin activity timeline error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching activity timeline" });
    }
});

router.get("/analytics/watchlist-vs-portfolio", async (req, res) => {
    try {
        const [watchlistAgg, portfolioAgg] = await Promise.all([
            WatchlistUser.aggregate([
                {
                    $group: {
                        _id: "$symbol",
                        watchingUsersSet: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        watchingUsers: { $size: "$watchingUsersSet" }
                    }
                },
                { $sort: { watchingUsers: -1, _id: 1 } },
                { $limit: 10 }
            ]),
            Portfolio.aggregate([
                { $unwind: "$holdings" },
                {
                    $group: {
                        _id: "$holdings.symbol",
                        investedUsersSet: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        investedUsers: { $size: "$investedUsersSet" }
                    }
                }
            ])
        ]);

        const investedMap = portfolioAgg.reduce((acc, item) => {
            acc[item._id] = item.investedUsers || 0;
            return acc;
        }, {});

        const data = watchlistAgg.map((item) => ({
            symbol: item._id,
            watchingUsers: item.watchingUsers || 0,
            investedUsers: investedMap[item._id] || 0
        }));

        return res.json({ success: true, data });
    } catch (error) {
        console.error("Admin watchlist-vs-portfolio error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching watchlist vs portfolio analytics" });
    }
});

router.get("/stocks", async (req, res) => {
    try {
        const exchange = req.query.exchange || "US";
        const search = (req.query.search || "").trim().toLowerCase();
        const limit = Math.min(parseInt(req.query.limit, 10) || 80, 200);

        const [symbols, visibilitySettings] = await Promise.all([
            fetchFinnhubSymbols(exchange),
            AdminStockVisibility.find({ exchange }).lean()
        ]);

        const visibilityMap = visibilitySettings.reduce((acc, item) => {
            acc[item.symbol] = item;
            return acc;
        }, {});

        const merged = symbols
            .filter((item) => {
                if (!search) return true;
                return item.symbol.toLowerCase().includes(search)
                    || item.companyName.toLowerCase().includes(search)
                    || item.market.toLowerCase().includes(search);
            })
            .slice(0, limit)
            .map((item) => ({
                symbol: item.symbol,
                companyName: item.companyName,
                market: item.market,
                exchange: item.exchange,
                enabled: visibilityMap[item.symbol]?.isEnabled ?? true,
                updatedAt: visibilityMap[item.symbol]?.updatedAt || null
            }));

        return res.json({
            success: true,
            data: merged,
            meta: { exchange, total: merged.length }
        });
    } catch (error) {
        console.error("Admin stocks error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching stock management data" });
    }
});

router.patch("/stocks/:symbol/visibility", async (req, res) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const isEnabled = Boolean(req.body.isEnabled);
        const stockRecord = await AdminStockVisibility.findOneAndUpdate(
            { symbol },
            {
                $set: {
                    symbol,
                    companyName: req.body.companyName || symbol,
                    market: req.body.market || req.body.exchange || "US",
                    exchange: req.body.exchange || "US",
                    isEnabled,
                    updatedBy: req.userId
                }
            },
            { upsert: true, new: true }
        );

        await logAdminActivity({
            actorId: req.userId,
            action: isEnabled ? "STOCK_ENABLED" : "STOCK_DISABLED",
            entityType: "stock",
            entityId: symbol,
            description: `${symbol} was ${isEnabled ? "enabled" : "disabled"} for user visibility`,
            severity: isEnabled ? "info" : "warning",
            metadata: { symbol, companyName: stockRecord.companyName, market: stockRecord.market }
        });

        return res.json({
            success: true,
            message: `${symbol} ${isEnabled ? "enabled" : "disabled"} successfully`,
            data: stockRecord
        });
    } catch (error) {
        console.error("Admin stock visibility error:", error.message);
        return res.status(500).json({ success: false, message: "Error updating stock visibility" });
    }
});

router.get("/platform-settings", async (req, res) => {
    try {
        const settings = await getPlatformSettings();
        return res.json({ success: true, data: settings });
    } catch (error) {
        console.error("Admin platform settings error:", error.message);
        return res.status(500).json({ success: false, message: "Error fetching platform settings" });
    }
});

router.put("/platform-settings", async (req, res) => {
    try {
        const previousSettings = await getPlatformSettings();

        const payload = {
            apiRefreshInterval: Number(req.body.apiRefreshInterval),
            maintenanceMode: Boolean(req.body.maintenanceMode)
        };

        if (!Number.isFinite(payload.apiRefreshInterval) || payload.apiRefreshInterval < 5) {
            return res.status(400).json({ success: false, message: "API refresh interval must be at least 5 seconds" });
        }

        const settings = await AdminPlatformSetting.findOneAndUpdate(
            { key: "platform" },
            {
                $set: { ...payload, key: "platform" },
                $unset: {
                    maxTradeValue: "",
                    maxDailyTrades: ""
                }
            },
            { upsert: true, new: true, runValidators: true }
        );

        const changes = {
            apiRefreshInterval: {
                from: Number.isFinite(Number(previousSettings.apiRefreshInterval))
                    ? Number(previousSettings.apiRefreshInterval)
                    : null,
                to: payload.apiRefreshInterval
            },
            maintenanceMode: {
                from: Boolean(previousSettings.maintenanceMode),
                to: payload.maintenanceMode
            }
        };

        await logAdminAction(req.userId, "SETTINGS_UPDATED", null, { changes });

        if (changes.maintenanceMode.from !== changes.maintenanceMode.to) {
            await logAdminAction(req.userId, "MAINTENANCE_TOGGLED", null, {
                enabled: payload.maintenanceMode
            });
        }

        return res.json({ success: true, data: settings, message: "Platform settings updated" });
    } catch (error) {
        console.error("Admin settings update error:", error.message);
        return res.status(500).json({ success: false, message: "Error updating platform settings" });
    }
});

router.patch("/users/:id/status", async (req, res) => {
    try {
        const { accountStatus, reason = "" } = req.body;
        if (!["active", "suspended"].includes(accountStatus)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.role === "admin") {
            return res.status(403).json({ success: false, message: "Cannot modify another admin account" });
        }

        user.accountStatus = accountStatus;
        await user.save();

        if (accountStatus === "suspended") {
            await logAdminAction(req.userId, "USER_SUSPENDED", user._id, {
                reason: typeof reason === "string" ? reason.trim() : ""
            });
        } else {
            await logAdminAction(req.userId, "USER_REACTIVATED", user._id, {});
        }

        return res.json({ success: true, message: `User status updated to ${accountStatus}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error updating status" });
    }
});

router.patch("/users/:id/role", async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });
        if (targetUser.email === "tradetrackadmin@gmail.com") {
            return res.status(403).json({ success: false, message: "Cannot change the role of the master admin." });
        }

        targetUser.role = role;
        await targetUser.save();

        await logAdminActivity({
            actorId: req.userId,
            action: "USER_ROLE_CHANGED",
            entityType: "user",
            entityId: targetUser._id.toString(),
            description: `${targetUser.username} role changed to ${role}`,
            metadata: { username: targetUser.username, email: targetUser.email, role }
        });

        return res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error changing role" });
    }
});

router.delete("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.role === "admin") {
            return res.status(403).json({ success: false, message: "Cannot delete an admin account" });
        }

        const userId = user._id;
        await Promise.all([
            User.findByIdAndDelete(userId),
            Portfolio.deleteMany({ userId }),
            Transaction.deleteMany({ userId }),
            UserSettings.deleteMany({ userId }),
            SearchHistory.deleteMany({ userId }).catch(() => null),
            Notification.deleteMany({ userId }).catch(() => null),
            WatchlistUser.deleteMany({ userId }).catch(() => null),
            Alert.deleteMany({ userId }).catch(() => null)
        ]);

        await logAdminAction(req.userId, "USER_DELETED", {
            _id: userId,
            username: user.username,
            email: user.email
        }, {
            email: user.email
        });

        return res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Admin delete user error:", error.message);
        return res.status(500).json({ success: false, message: "Server error deleting user" });
    }
});

module.exports = router;
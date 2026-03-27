const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ─── Helper: time range from period string ─────────────────────────────────
function getDateFrom(period) {
    const now = new Date();
    switch (period) {
        case '1D': return new Date(now - 24 * 60 * 60 * 1000);
        case '1W': return new Date(now - 7 * 24 * 60 * 60 * 1000);
        case '1M': return new Date(now - 30 * 24 * 60 * 60 * 1000);
        case '1Y': return new Date(now - 365 * 24 * 60 * 60 * 1000);
        default: return null; // ALL
    }
}

// ─── Helper: group format by period ───────────────────────────────────────
function getGroupFormat(period) {
    switch (period) {
        case '1D': return '%H:00';       // Hour buckets
        case '1W': return '%m-%d';       // Day buckets
        case '1M': return '%m-%d';       // Day buckets
        case '1Y': return '%Y-%m';       // Month buckets
        default: return '%Y-%m';       // Month buckets for ALL
    }
}

// ========================================
// GET /api/admin/dashboard  (summary)
// ========================================
router.get('/dashboard', async (req, res) => {
    try {
        const [totalUsers, totalTransactions, activeAlerts] = await Promise.all([
            User.countDocuments(),
            Transaction.countDocuments(),
            require('../models/Alert').countDocuments({ isActive: true }).catch(() => 0)
        ]);

        // Active portfolios = portfolios with at least one holding
        const activePortfolios = await Portfolio.countDocuments({
            'holdings.0': { $exists: true }
        });

        // System investment aggregation
        const portfolioAgg = await Portfolio.aggregate([
            { $unwind: { path: '$holdings', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: null,
                    totalInvestment: { $sum: { $multiply: ['$holdings.quantity', '$holdings.avgBuyPrice'] } },
                    totalCurrentValue: {
                        $sum: {
                            $multiply: [
                                '$holdings.quantity',
                                { $ifNull: ['$holdings.currentPrice', '$holdings.avgBuyPrice'] }
                            ]
                        }
                    }
                }
            }
        ]);

        const totalInvestment = portfolioAgg[0]?.totalInvestment || 0;
        const totalProfitLoss = portfolioAgg[0]
            ? portfolioAgg[0].totalCurrentValue - portfolioAgg[0].totalInvestment
            : 0;

        // Recent 10 transactions (sorted by executedAt)
        const recentTransactions = await Transaction.find()
            .populate('userId', 'username email')
            .sort({ executedAt: -1 })
            .limit(10)
            .lean();

        // Chart data: last 7 days grouped by day
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const chartDataRaw = await Transaction.aggregate([
            { $match: { executedAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%m-%d', date: '$executedAt' } },
                    count: { $sum: 1 },
                    volume: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // requests today = count transactions created today
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const apiCallsToday = await Transaction.countDocuments({ executedAt: { $gte: todayStart } });

        return res.json({
            success: true,
            data: {
                totalUsers,
                totalTransactions,
                totalPortfolios: activePortfolios,
                activeAlerts,
                totalInvestment,
                totalProfitLoss,
                recentTransactions,
                chartData: chartDataRaw,
                apiCallsToday
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error fetching dashboard' });
    }
});

// ========================================
// GET /api/admin/stats  — top 4 cards
// ========================================
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalTransactions] = await Promise.all([
            User.countDocuments(),
            Transaction.countDocuments()
        ]);

        const activePortfolios = await Portfolio.countDocuments({
            'holdings.0': { $exists: true }
        });

        const investmentAgg = await Portfolio.aggregate([
            { $unwind: { path: '$holdings', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: null,
                    totalInvestment: { $sum: { $multiply: ['$holdings.quantity', '$holdings.avgBuyPrice'] } }
                }
            }
        ]);
        const totalInvestment = investmentAgg[0]?.totalInvestment || 0;

        // Week-over-week growth for users
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
            : newUsersThisWeek > 0 ? '100' : '0';
        const txGrowth = txLastWeek > 0
            ? (((txThisWeek - txLastWeek) / txLastWeek) * 100).toFixed(1)
            : txThisWeek > 0 ? '100' : '0';

        return res.json({
            success: true,
            data: {
                totalUsers,
                activePortfolios,
                totalTransactions,
                totalInvestment,
                trends: {
                    userGrowth: Number(userGrowth),
                    userTrendUp: Number(userGrowth) >= 0,
                    txGrowth: Number(txGrowth),
                    txTrendUp: Number(txGrowth) >= 0
                }
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error.message);
        return res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
});

// ========================================
// GET /api/admin/chart?period=1W
// Returns BUY/SELL counts grouped by time
// ========================================
router.get('/chart', async (req, res) => {
    try {
        const period = req.query.period || '1W';
        const dateFrom = getDateFrom(period);
        const groupFmt = getGroupFormat(period);

        const matchStage = dateFrom
            ? { $match: { executedAt: { $gte: dateFrom } } }
            : { $match: {} };

        const chartRaw = await Transaction.aggregate([
            matchStage,
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: groupFmt, date: '$executedAt' } },
                        type: '$type'
                    },
                    count: { $sum: 1 },
                    volume: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        // Pivot into { label, buy, sell } format for easy charting
        const bucketMap = {};
        chartRaw.forEach(row => {
            const key = row._id.date;
            if (!bucketMap[key]) bucketMap[key] = { label: key, buy: 0, sell: 0, volume: 0 };
            if (row._id.type === 'BUY') bucketMap[key].buy += row.count;
            else if (row._id.type === 'SELL') bucketMap[key].sell += row.count;
            bucketMap[key].volume += row.volume;
        });

        const buckets = Object.values(bucketMap).sort((a, b) => a.label.localeCompare(b.label));

        return res.json({ success: true, data: buckets, period });
    } catch (error) {
        console.error('Admin chart error:', error.message);
        return res.status(500).json({ success: false, message: 'Error fetching chart data' });
    }
});

// ========================================
// GET /api/admin/system-health
// ========================================
router.get('/system-health', async (req, res) => {
    const startTime = Date.now();

    // MongoDB status
    const mongoState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const mongoStatus = mongoState === 1 ? 'Online' : mongoState === 2 ? 'Connecting' : 'Offline';
    const mongoLatency = Date.now() - startTime;

    // Finnhub API ping
    let finnhubStatus = 'Unknown';
    let finnhubLatency = null;
    const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_KEY) {
        try {
            const t0 = Date.now();
            await axios.get('https://finnhub.io/api/v1/quote', {
                params: { symbol: 'AAPL', token: FINNHUB_KEY },
                timeout: 5000
            });
            finnhubLatency = Date.now() - t0;
            finnhubStatus = 'Connected';
        } catch {
            finnhubStatus = 'Failed';
        }
    } else {
        finnhubStatus = 'No API Key';
    }

    // Transactions today (proxy for API activity)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const transactionsToday = await Transaction.countDocuments({ executedAt: { $gte: todayStart } }).catch(() => 0);

    return res.json({
        success: true,
        data: {
            mongo: { status: mongoStatus, latency: mongoLatency },
            express: { status: 'Active', uptime: Math.round(process.uptime()) },
            finnhub: { status: finnhubStatus, latency: finnhubLatency, requestsToday: transactionsToday }
        }
    });
});

// ========================================
// GET /api/admin/recent-users
// ========================================
router.get('/recent-users', async (req, res) => {
    try {
        const users = await User.find()
            .select('username email createdAt accountStatus role')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        return res.json({ success: true, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching recent users' });
    }
});

// ========================================
// GET /api/admin/activity-log
// Returns last 10 transactions as activity
// ========================================
router.get('/activity-log', async (req, res) => {
    try {
        const txs = await Transaction.find()
            .populate('userId', 'username')
            .sort({ executedAt: -1 })
            .limit(10)
            .lean();

        const logs = txs.map(tx => ({
            _id: tx._id,
            message: `${tx.userId?.username || 'User'} ${tx.type === 'BUY' ? 'bought' : 'sold'} ${tx.quantity} × ${tx.symbol} for $${(tx.totalAmount || 0).toFixed(2)}`,
            type: tx.type,
            symbol: tx.symbol,
            username: tx.userId?.username || 'Unknown',
            timestamp: tx.executedAt || tx.createdAt
        }));

        return res.json({ success: true, data: logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching activity log' });
    }
});

// ========================================
// GET /api/admin/users  — enriched with portfolio value + tx count
// ========================================
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password -passwordResetToken -emailVerificationToken -refreshTokenHash')
            .sort({ createdAt: -1 })
            .lean();

        // Aggregate portfolio value per userId
        const portfolioValues = await Portfolio.aggregate([
            { $unwind: { path: '$holdings', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$userId',
                    portfolioValue: {
                        $sum: {
                            $multiply: [
                                '$holdings.quantity',
                                { $ifNull: ['$holdings.currentPrice', '$holdings.avgBuyPrice'] }
                            ]
                        }
                    }
                }
            }
        ]);
        const pvMap = {};
        portfolioValues.forEach(p => { pvMap[p._id.toString()] = p.portfolioValue; });

        // Aggregate transaction count per userId
        const txCounts = await Transaction.aggregate([
            { $group: { _id: '$userId', count: { $sum: 1 } } }
        ]);
        const txMap = {};
        txCounts.forEach(t => { txMap[t._id.toString()] = t.count; });

        const enriched = users.map(u => ({
            ...u,
            portfolioValue: pvMap[u._id.toString()] || 0,
            transactionCount: txMap[u._id.toString()] || 0
        }));

        return res.json({ success: true, data: enriched });
    } catch (error) {
        console.error('Admin users error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
});

// ========================================
// GET /api/admin/transactions
// ========================================
router.get('/transactions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            Transaction.find()
                .populate('userId', 'username email')
                .sort({ executedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments()
        ]);

        return res.json({
            success: true,
            data: transactions,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching transactions' });
    }
});

// ========================================
// PATCH /api/admin/users/:id/status
// ========================================
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { accountStatus } = req.body;
        if (!['active', 'suspended'].includes(accountStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot modify another admin account' });
        }
        user.accountStatus = accountStatus;
        await user.save();
        return res.json({ success: true, message: `User status updated to ${accountStatus}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error updating status' });
    }
});

// ========================================
// PATCH /api/admin/users/:id/role
// ========================================
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
        if (targetUser.email === 'tradetrackadmin@gmail.com') {
            return res.status(403).json({ success: false, message: 'Cannot change the role of the master admin.' });
        }
        targetUser.role = role;
        await targetUser.save();
        return res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error changing role' });
    }
});

// ========================================
// DELETE /api/admin/users/:id
// ========================================
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete an admin account' });
        }
        await User.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error deleting user' });
    }
});

module.exports = router;

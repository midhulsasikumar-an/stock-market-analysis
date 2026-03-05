const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const WatchlistUser = require('../models/WatchlistUser');
const Notification = require('../models/Notification');
const SearchHistory = require('../models/SearchHistory');
const UserSettings = require('../models/UserSettings');
const bcrypt = require('bcrypt');
const axios = require('axios');

router.use(authMiddleware);

// ========================================
// GET /api/avatar/user-summary
// ========================================
router.get('/user-summary', async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const portfolio = await Portfolio.findOne({ userId: req.userId });
        const watchlist = await WatchlistUser.findOne({ userId: req.userId });
        const notifications = await Notification.find({ userId: req.userId, isRead: false }).sort({ createdAt: -1 }).limit(5);

        // Portfolio Stats Calculation
        let totalInvested = 0;
        let currentPortfolioValue = 0;
        let bestStock = null;
        let worstStock = null;
        let bestPerf = -Infinity;
        let worstPerf = Infinity;
        let riskProfile = 'Moderate risk'; // Default

        const holdings = portfolio ? portfolio.holdings : [];
        const numStocks = holdings.length;

        holdings.forEach(h => {
            const invested = h.quantity * h.avgBuyPrice;
            const currentPrice = h.currentPrice || h.avgBuyPrice;
            const currentValue = h.quantity * currentPrice;

            totalInvested += invested;
            currentPortfolioValue += currentValue;

            const perf = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;
            if (perf > bestPerf) { bestPerf = perf; bestStock = h.symbol; }
            if (perf < worstPerf) { worstPerf = perf; worstStock = h.symbol; }
        });

        const totalPnL = currentPortfolioValue - totalInvested;

        // Risk estimation (mock logic as per prompt: large cap vs small cap based on random check, but we'll use performance variance here)
        if (numStocks > 0) {
            const avgVol = Math.abs(bestPerf - worstPerf);
            if (avgVol > 30) riskProfile = 'High risk';
            else if (avgVol < 10) riskProfile = 'Low risk';
        }

        // Top 5 watchlist
        const top5watchlist = watchlist && watchlist.symbols ? watchlist.symbols.slice(0, 5) : [];

        // Try getting prices for watchlist if not cached? For performance, we'll just return symbols here, frontend can fetch or we can return empty price
        const wlData = top5watchlist.map(s => ({ symbol: s, price: 0, change: 0 }));

        return res.json({
            success: true,
            data: {
                profile: {
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                    createdAt: user.createdAt,
                    role: user.role
                },
                portfolioSummary: {
                    totalInvested,
                    currentPortfolioValue,
                    totalPnL,
                    numStocks,
                    bestStock: bestStock || 'N/A',
                    worstStock: worstStock || 'N/A'
                },
                watchlist: wlData,
                notifications,
                analytics: {
                    growth: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
                    riskProfile
                }
            }
        });
    } catch (error) {
        console.error('Avatar user summary error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching avatar data' });
    }
});

// ========================================
// GET /api/avatar/admin-summary
// ========================================
router.get('/admin-summary', async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const [totUsers, totPorts, totWatchlists, totSearches] = await Promise.all([
            User.countDocuments(),
            Portfolio.countDocuments(),
            WatchlistUser.countDocuments(),
            SearchHistory.countDocuments()
        ]);

        // System Monitoring
        const mongoState = mongoose.connection.readyState === 1 ? 'Online' : 'Offline';
        let finnhubStatus = 'Checking...';
        try {
            await axios.get('https://finnhub.io/api/v1/quote', { params: { symbol: 'AAPL', token: process.env.FINNHUB_API_KEY }, timeout: 2000 });
            finnhubStatus = 'Connected';
        } catch (e) { finnhubStatus = 'Failed'; }

        // Mocks for admin alerts
        const adminNotifications = [
            { id: 1, title: 'DB Backed Up', time: new Date() },
            { id: 2, title: 'Server Load Normal', time: new Date() }
        ];

        return res.json({
            success: true,
            data: {
                profile: {
                    name: user.username,
                    email: user.email,
                    role: 'Administrator',
                    createdAt: user.createdAt,
                    profileImage: user.profileImage
                },
                platformOverview: {
                    totalUsers: totUsers,
                    totalPortfolios: totPorts,
                    totalWatchlists: totWatchlists,
                    totalSearches: totSearches
                },
                system: {
                    apiStatus: finnhubStatus,
                    serverStatus: 'Active',
                    dbConnectivity: mongoState
                },
                notifications: adminNotifications
            }
        });

    } catch (error) {
        console.error('Avatar admin summary error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching avatar data' });
    }
});

// ========================================
// PUT /api/avatar/update-profile
// ========================================
router.put('/update-profile', async (req, res) => {
    try {
        const { username, firstName, lastName, profileImage } = req.body;
        const user = await User.findById(req.userId);

        if (username) user.username = username;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (profileImage !== undefined) user.profileImage = profileImage;

        await user.save();
        res.json({ success: true, message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

// ========================================
// PUT /api/avatar/update-settings
// ========================================
router.put('/update-settings', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId).select('+password');

        if (currentPassword && newPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid current password' });
            user.password = newPassword;
            await user.save();
            return res.json({ success: true, message: 'Password updated' });
        }
        res.status(400).json({ success: false, message: 'Missing fields' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating settings' });
    }
});

module.exports = router;

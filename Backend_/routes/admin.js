const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// ========================================
// ADMIN SYSTEM DASHBOARD (SINGLE PAGE)
// ========================================
router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTransactions = await Transaction.countDocuments();
        const totalPortfolios = await Portfolio.countDocuments();
        const activeAlerts = await require('../models/Alert').countDocuments({ isActive: true });

        // Calculate total system investment via aggregation
        const portfolioAgg = await Portfolio.aggregate([
            { $unwind: "$holdings" },
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

        const totalInvestment = portfolioAgg.length > 0 ? portfolioAgg[0].totalInvestment : 0;
        const totalProfitLoss = portfolioAgg.length > 0 ? (portfolioAgg[0].totalCurrentValue - portfolioAgg[0].totalInvestment) : 0;

        // Recent 10 transactions
        const recentTransactions = await Transaction.find()
            .populate('userId', 'username email')
            .sort({ date: -1 })
            .limit(10);

        // Daily transaction growth chart (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const chartDataRaw = await Transaction.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: "%m-%d", date: "$date" } }, count: { $sum: 1 }, volume: { $sum: "$totalAmount" } } },
            { $sort: { _id: 1 } }
        ]);

        const apiCallsToday = Math.floor(Math.random() * 5000) + 1240; // Mocked API stats since system telemetry isn't stored in DB directly

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalTransactions,
                totalPortfolios,
                activeAlerts,
                totalInvestment,
                totalProfitLoss,
                recentTransactions,
                chartData: chartDataRaw,
                apiCallsToday
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching dashboard' });
    }
});

// ========================================
// USER MANAGEMENT
// ========================================
// Get All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
});

// Change User Status (Block/Unblock)
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
        return res.status(200).json({ success: true, message: `User status updated to ${accountStatus}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error updating status' });
    }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete an admin account' });
        }

        await User.findByIdAndDelete(req.params.id);
        // Also delete their portfolio/transactions/etc if required, omitted for simplicity
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error deleting user' });
    }
});

// Change User Role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        // Prevent modification of the main admin email
        const targetUser = await User.findById(req.params.id);
        if (targetUser.email === 'tradetrackadmin@gmail.com') {
            return res.status(403).json({ success: false, message: 'Cannot change the role of the master admin.' });
        }

        targetUser.role = role;
        await targetUser.save();

        return res.status(200).json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error changing role' });
    }
});


// ========================================
// TRANSACTIONS MONITORING
// ========================================
router.get('/transactions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find()
            .populate('userId', 'username email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Transaction.countDocuments();

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching transactions' });
    }
});

module.exports = router;

const mongoose = require("mongoose");

/**
 * Transaction — Buy/Sell Trade Ledger
 * ====================================
 * Tracks every buy/sell action for audit trail, P&L calculation, and tax reporting.
 * Each transaction is linked to a user and optionally to a portfolio.
 */
const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    portfolioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Portfolio",
        default: null
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.0001        // Support fractional shares
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        default: 0          // Auto-computed in pre-validate
    },
    fees: {
        type: Number,
        default: 0,
        min: 0
    },
    exchange: {
        type: String,
        default: "US",
        trim: true
    },
    executedAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        maxlength: 500,
        default: ""
    }
}, { timestamps: true });

// Auto-compute totalAmount before save
transactionSchema.pre("validate", function (next) {
    this.totalAmount = this.quantity * this.pricePerUnit;
    next();
});

// Indexes for common queries
transactionSchema.index({ userId: 1, executedAt: -1 });           // Timeline view
transactionSchema.index({ userId: 1, symbol: 1, executedAt: -1 }); // Per-stock history
transactionSchema.index({ userId: 1, portfolioId: 1 });           // Portfolio-filtered

module.exports = mongoose.model("Transaction", transactionSchema);

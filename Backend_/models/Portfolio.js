const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema({
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true, min: 0 },
    buyDate: { type: Date, default: Date.now },
    exchange: { type: String, default: "NSE" },
    notes: { type: String, maxlength: 500 }
}, { _id: true });

const portfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        default: "My Portfolio"
    },
    description: { type: String, maxlength: 300 },
    currency: { type: String, default: "INR" },
    holdings: [holdingSchema],
    totalInvested: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index — one default portfolio per user
portfolioSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model("Portfolio", portfolioSchema);

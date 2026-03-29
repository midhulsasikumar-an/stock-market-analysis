const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema({
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, default: null },
    lastPriceUpdate: { type: Date, default: null },
    buyDate: { type: Date, default: Date.now },
    exchange: { type: String, default: "US" },
    sector: { type: String, trim: true, default: "" },
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
    currency: { type: String, default: "USD" },
    holdings: [holdingSchema],
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// Virtual: auto-compute totalInvested (never stale)
portfolioSchema.virtual("totalInvested").get(function () {
    return this.holdings.reduce((sum, h) => sum + h.quantity * h.avgBuyPrice, 0);
});

// Virtual: auto-compute current value
portfolioSchema.virtual("currentValue").get(function () {
    return this.holdings.reduce((sum, h) => {
        const price = h.currentPrice ?? h.avgBuyPrice;
        return sum + h.quantity * price;
    }, 0);
});

// Include virtuals in JSON/Object output
portfolioSchema.set("toJSON", { virtuals: true });
portfolioSchema.set("toObject", { virtuals: true });

// Compound index — one default portfolio per user
portfolioSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model("Portfolio", portfolioSchema);

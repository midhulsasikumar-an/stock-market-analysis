const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    defaultCurrency: { type: String, default: "INR" },
    defaultExchange: { type: String, default: "NSE" },
    chartType: { type: String, enum: ["candlestick", "line", "area"], default: "candlestick" },
    defaultTimeframe: { type: String, enum: ["1D", "1W", "1M", "3M", "1Y", "ALL"], default: "3M" },
    notifications: {
        email: { type: Boolean, default: true },
        app: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true }
    },
    dashboardLayout: {
        showWatchlist: { type: Boolean, default: true },
        showNews: { type: Boolean, default: true },
        showPortfolio: { type: Boolean, default: false },
        showMarketOverview: { type: Boolean, default: true }
    },
    watchlistLimit: { type: Number, default: 20, max: 50 }
}, { timestamps: true });

module.exports = mongoose.model("UserSettings", userSettingsSchema);

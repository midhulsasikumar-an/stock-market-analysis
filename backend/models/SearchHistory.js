const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, trim: true },
    searchedAt: { type: Date, default: Date.now }
}, { timestamps: false });

// Unique per user+symbol (upsert-friendly)
searchHistorySchema.index({ userId: 1, symbol: 1 }, { unique: true });
// Query optimization: recent searches first
searchHistorySchema.index({ userId: 1, searchedAt: -1 });
// TTL: auto-delete searches older than 90 days
searchHistorySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);

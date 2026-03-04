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

// Keep only latest 20 searches per user via TTL or manual cleanup
searchHistorySchema.index({ userId: 1, searchedAt: -1 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);

const mongoose = require("mongoose");

const WatchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
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
        enum: ["stock", "crypto", "etf", "index"],
        default: "stock"
    },
    exchange: {
        type: String,
        default: "US",
        trim: true
    },
    notes: {
        type: String,
        maxlength: 200,
        default: ""
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure unique symbol per user
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });
// Query optimization: sorted fetch
WatchlistSchema.index({ userId: 1, addedAt: -1 });

module.exports = mongoose.model("WatchlistUser", WatchlistSchema);

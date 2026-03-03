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
        default: "stock"
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

module.exports = mongoose.model("WatchlistUser", WatchlistSchema);

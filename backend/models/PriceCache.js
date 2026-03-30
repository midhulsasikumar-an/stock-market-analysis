const mongoose = require("mongoose");

const priceCacheSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        currentPrice: {
            type: Number,
            required: true
        },
        lastUpdated: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PriceCache", priceCacheSchema);

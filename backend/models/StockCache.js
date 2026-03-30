const mongoose = require("mongoose");

/**
 * StockCache — Persistent MongoDB Cache for External API Data
 * =============================================================
 * Replaces the in-memory Map() cache in market.js with a MongoDB-backed store.
 * Survives server restarts, shareable across instances.
 * Uses TTL index for automatic expiration — MongoDB garbage-collects expired docs.
 */
const stockCacheSchema = new mongoose.Schema({
    cacheKey: {
        type: String,
        required: true,
        unique: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    dataType: {
        type: String,
        enum: ["quote", "candle", "profile", "metrics", "news", "recommendation", "symbols", "status", "overview", "earnings", "search"],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// TTL index — MongoDB auto-deletes docs when expiresAt is in the past
stockCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Static helper: get cached data if not expired
 * @param {string} key - cache key (e.g. "quote:AAPL")
 * @returns {object|null} cached data or null
 */
stockCacheSchema.statics.getCached = async function (key) {
    const entry = await this.findOne({ cacheKey: key, expiresAt: { $gt: new Date() } }).lean();
    return entry ? entry.data : null;
};

/**
 * Static helper: upsert cache entry
 * @param {string} key - cache key
 * @param {object} data - data to cache
 * @param {string} dataType - type of data
 * @param {number} ttlMs - time-to-live in milliseconds
 */
stockCacheSchema.statics.setCached = async function (key, data, dataType, ttlMs) {
    const expiresAt = new Date(Date.now() + ttlMs);
    await this.findOneAndUpdate(
        { cacheKey: key },
        { cacheKey: key, data, dataType, expiresAt },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model("StockCache", stockCacheSchema);

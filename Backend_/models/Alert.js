const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    type: {
        type: String,
        enum: ["PRICE_ABOVE", "PRICE_BELOW", "PERCENT_CHANGE"],
        required: true
    },
    targetValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    isTriggered: { type: Boolean, default: false },
    triggeredAt: { type: Date, default: null },
    repeat: { type: Boolean, default: false },           // one-shot vs persistent
    lastCheckedPrice: { type: Number, default: null },    // for debugging
    message: { type: String, maxlength: 200 },
    notifyVia: { type: [String], default: ["app"] },      // app, email
    expiresAt: { type: Date, default: null }               // optional auto-expiry
}, { timestamps: true });

// Query: active alerts for a user
alertSchema.index({ userId: 1, isActive: 1, symbol: 1 });
// TTL: auto-delete expired alerts (MongoDB checks every 60s)
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Alert", alertSchema);

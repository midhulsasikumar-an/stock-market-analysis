const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: ["PRICE_ABOVE", "PRICE_BELOW", "PERCENT_CHANGE"], required: true },
    targetValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    isTriggered: { type: Boolean, default: false },
    triggeredAt: { type: Date, default: null },
    message: { type: String, maxlength: 200 },
    notifyVia: { type: [String], default: ["app"] }  // app, email
}, { timestamps: true });

alertSchema.index({ userId: 1, symbol: 1 });

module.exports = mongoose.model("Alert", alertSchema);

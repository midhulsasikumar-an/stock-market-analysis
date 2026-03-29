const mongoose = require("mongoose");

const adminStockVisibilitySchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    companyName: {
        type: String,
        default: "",
        trim: true
    },
    market: {
        type: String,
        default: "US",
        trim: true
    },
    exchange: {
        type: String,
        default: "US",
        trim: true
    },
    isEnabled: {
        type: Boolean,
        default: true,
        index: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, { timestamps: true });

adminStockVisibilitySchema.index({ exchange: 1, symbol: 1 });

module.exports = mongoose.model("AdminStockVisibility", adminStockVisibilitySchema);
const mongoose = require("mongoose");

const adminPlatformSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: "platform"
    },
    apiRefreshInterval: {
        type: Number,
        default: 60,
        min: 5,
        max: 3600
    },
    maxTradeValue: {
        type: Number,
        default: 250000,
        min: 1000
    },
    maxDailyTrades: {
        type: Number,
        default: 50,
        min: 1,
        max: 10000
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("AdminPlatformSetting", adminPlatformSettingSchema);
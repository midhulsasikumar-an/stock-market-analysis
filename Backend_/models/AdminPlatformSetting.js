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
    maintenanceMode: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("AdminPlatformSetting", adminPlatformSettingSchema);
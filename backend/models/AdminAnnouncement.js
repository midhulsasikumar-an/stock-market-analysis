const mongoose = require("mongoose");

const adminAnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    severity: {
        type: String,
        enum: ["info", "warning", "maintenance"],
        default: "info",
        index: true
    },
    target: {
        type: String,
        enum: ["all", "active"],
        default: "all",
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    expiredAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

adminAnnouncementSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminAnnouncement", adminAnnouncementSchema);

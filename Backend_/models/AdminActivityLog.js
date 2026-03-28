const mongoose = require("mongoose");

const adminActivityLogSchema = new mongoose.Schema({
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    entityType: {
        type: String,
        required: true,
        trim: true
    },
    entityId: {
        type: String,
        default: "",
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    severity: {
        type: String,
        enum: ["info", "warning", "critical"],
        default: "info"
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ entityType: 1, createdAt: -1 });

module.exports = mongoose.model("AdminActivityLog", adminActivityLogSchema);
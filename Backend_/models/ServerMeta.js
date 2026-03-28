const mongoose = require("mongoose");

const serverMetaSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        value: {
            type: Date,
            required: true
        },
        updatedAt: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    {
        collection: "server_meta"
    }
);

module.exports = mongoose.model("ServerMeta", serverMetaSchema);

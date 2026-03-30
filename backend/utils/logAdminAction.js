const mongoose = require("mongoose");
const User = require("../models/User");
const AdminActivityLog = require("../models/AdminActivityLog");

function formatUserLabel(user, fallback = "User") {
    if (!user) return fallback;

    const username = typeof user.username === "string" && user.username.trim()
        ? user.username.trim()
        : "";
    const email = typeof user.email === "string" && user.email.trim()
        ? user.email.trim()
        : "";

    if (username && email) return `${username} (${email})`;
    if (username) return username;
    if (email) return email;
    return fallback;
}

function toObjectIdString(value) {
    if (!value) return "";
    const normalized = String(value).trim();
    return mongoose.Types.ObjectId.isValid(normalized) ? normalized : "";
}

function buildDescription(actorLabel, action, targetLabel, details = {}) {
    switch (action) {
        case "USER_SUSPENDED":
            return `${actorLabel} suspended user ${targetLabel}${details.reason ? ` (reason: ${details.reason})` : ""}`;
        case "USER_REACTIVATED":
            return `${actorLabel} reactivated user ${targetLabel}`;
        case "USER_DELETED":
            return `${actorLabel} deleted user ${targetLabel}`;
        case "SETTINGS_UPDATED":
            return `${actorLabel} updated platform settings`;
        case "MAINTENANCE_TOGGLED":
            return `${actorLabel} ${details.enabled ? "enabled" : "disabled"} maintenance mode`;
        default:
            return `${actorLabel} performed ${action}${targetLabel ? ` on ${targetLabel}` : ""}`;
    }
}

function getSeverity(action, details = {}) {
    if (action === "USER_DELETED") return "critical";
    if (action === "USER_SUSPENDED") return "warning";
    if (action === "MAINTENANCE_TOGGLED" && details.enabled) return "warning";
    return "info";
}

async function resolveTargetUser(targetUser) {
    if (!targetUser) return null;

    if (typeof targetUser === "object") {
        return {
            _id: targetUser._id ? String(targetUser._id) : "",
            username: targetUser.username || "",
            email: targetUser.email || ""
        };
    }

    const targetId = toObjectIdString(targetUser);
    if (!targetId) {
        return { _id: "", username: String(targetUser), email: "" };
    }

    const user = await User.findById(targetId).select("username email").lean();
    if (!user) {
        return { _id: targetId, username: "User", email: "" };
    }

    return {
        _id: String(user._id),
        username: user.username || "",
        email: user.email || ""
    };
}

async function logAdminAction(adminId, action, targetUser, details = {}) {
    try {
        const [admin, target] = await Promise.all([
            User.findById(adminId).select("username email").lean(),
            resolveTargetUser(targetUser)
        ]);

        const actorLabel = formatUserLabel(admin, "Admin");
        const targetLabel = target ? formatUserLabel(target, "user") : "";

        const entityType = target ? "user" : "platform-settings";
        const entityId = target?._id || "";

        await AdminActivityLog.create({
            category: "admin",
            actorId: adminId || null,
            action,
            entityType,
            entityId,
            description: buildDescription(actorLabel, action, targetLabel, details),
            severity: getSeverity(action, details),
            metadata: {
                ...details,
                targetUserId: target?._id || "",
                targetUsername: target?.username || "",
                targetEmail: target?.email || ""
            }
        });
    } catch (error) {
        console.error("logAdminAction error:", error.message);
    }
}

module.exports = { logAdminAction };

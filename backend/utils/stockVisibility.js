const User = require("../models/User");
const AdminStockVisibility = require("../models/AdminStockVisibility");

async function isAdminUser(userId) {
    if (!userId) return false;
    const user = await User.findById(userId).select("role").lean();
    return user?.role === "admin";
}

async function canUserAccessSymbol(userId, symbol) {
    if (!symbol) return false;
    if (await isAdminUser(userId)) return true;

    const visibility = await AdminStockVisibility.findOne({ symbol: symbol.toUpperCase() })
        .select("isEnabled")
        .lean();

    return visibility ? visibility.isEnabled !== false : true;
}

async function filterVisibleSymbolsForUser(userId, items) {
    if (!Array.isArray(items) || items.length === 0) return [];
    if (await isAdminUser(userId)) return items;

    const symbols = items
        .map((item) => typeof item === "string" ? item : item?.symbol || item?.displaySymbol)
        .filter(Boolean)
        .map((symbol) => symbol.toUpperCase());

    const disabled = await AdminStockVisibility.find({
        symbol: { $in: symbols },
        isEnabled: false
    }).select("symbol").lean();

    const disabledSet = new Set(disabled.map((item) => item.symbol));

    return items.filter((item) => {
        const symbol = (typeof item === "string" ? item : item?.symbol || item?.displaySymbol || "").toUpperCase();
        return !disabledSet.has(symbol);
    });
}

async function getVisibilityForSymbols(symbols) {
    const cleaned = symbols.map((symbol) => symbol.toUpperCase());
    const disabled = await AdminStockVisibility.find({
        symbol: { $in: cleaned },
        isEnabled: false
    }).select("symbol").lean();

    const disabledSet = new Set(disabled.map((item) => item.symbol));
    return cleaned.map((symbol) => ({ symbol, enabled: !disabledSet.has(symbol) }));
}

module.exports = {
    canUserAccessSymbol,
    filterVisibleSymbolsForUser,
    getVisibilityForSymbols,
    isAdminUser
};
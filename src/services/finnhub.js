/**
 * finnhub.js  —  Frontend Finnhub service (via backend proxy)
 * ============================================================
 * ✅ Live Price       /api/market/quote
 * ✅ Market Status    /api/market/status
 * ✅ News             /api/market/news
 * ✅ Recommendations  /api/market/recommendation
 * ✅ Candlestick data /api/market/candle  (for small sparklines)
 * ✅ Company Profile  /api/market/profile
 *
 * All calls go to your Express backend — NO Finnhub API key in browser.
 */

import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const marketApi = axios.create({
    baseURL: `${BASE}/api/market`,
    timeout: 10000,
});

// ─── Live Price ───────────────────────────────────────────────────────────────
/**
 * @param {string} symbol  e.g. "AAPL"
 * @returns {{ c, d, dp, h, l, o, pc } | null}
 *   c = current price, d = change, dp = % change, h/l = high/low, o/pc = open/prev close
 */
export const fetchQuote = async (symbol) => {
    try {
        const { data } = await marketApi.get("/quote", { params: { symbol } });
        return data;
    } catch (error) {
        console.warn(`[finnhub] quote failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        return null;
    }
};

// ─── Candlestick / Sparkline ──────────────────────────────────────────────────
/**
 * @param {string} symbol
 * @param {"D"|"W"|"M"|"60"|"15"|"5"|"1"} resolution
 * @param {number} days  — look-back window in days
 * @returns {{ c, h, l, o, t, v, s } | null}  (s = "ok" or "no_data")
 */
export const fetchCandles = async (symbol, resolution = "D", days = 7) => {
    try {
        const { data } = await marketApi.get("/candle", { params: { symbol, resolution, days } });
        return data;
    } catch (error) {
        // 429 = rate limit (not a paid-plan restriction) — return special marker
        if (error.response?.status === 429) {
            return { s: "rate_limited" };
        }
        console.warn(`[finnhub] candle failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        return null;
    }
};


// ─── Market Status ────────────────────────────────────────────────────────────
/**
 * @param {"US"|"LSE"|"TSX"} exchange
 * @returns {{ exchange, holiday, isOpen, session, t } | null}
 */
export const fetchMarketStatus = async (exchange = "US") => {
    try {
        const { data } = await marketApi.get("/status", { params: { exchange } });
        return data;
    } catch (error) {
        console.warn("[finnhub] market status failed:", error.response?.data?.error ?? error.message);
        return null;
    }
};

// ─── Market / Company News ────────────────────────────────────────────────────
/**
 * @param {string} [symbol]    If provided, fetches company-specific news
 * @param {string} [category]  "general" | "forex" | "crypto" | "merger"
 * @returns {Array}
 */
export const fetchMarketNews = async (symbol = null, category = "general") => {
    try {
        const params = symbol ? { symbol } : { category };
        const { data } = await marketApi.get("/news", { params });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn("[finnhub] news failed:", error.response?.data?.error ?? error.message);
        return [];
    }
};

// ─── Analyst Recommendations ──────────────────────────────────────────────────
/**
 * @param {string} symbol
 * @returns {Array<{ buy, hold, period, sell, strongBuy, strongSell, symbol }>}
 */
export const fetchRecommendation = async (symbol) => {
    try {
        const { data } = await marketApi.get("/recommendation", { params: { symbol } });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn(`[finnhub] recommendation failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        return [];
    }
};

// ─── Company Profile ──────────────────────────────────────────────────────────
/**
 * @param {string} symbol
 * @returns {{ name, ticker, exchange, ipo, marketCapitalization, logo, weburl, sector } | null}
 */
export const fetchCompanyProfile = async (symbol) => {
    try {
        const { data } = await marketApi.get("/profile", { params: { symbol } });
        return data;
    } catch (error) {
        console.warn(`[finnhub] profile failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        return null;
    }
};

export default marketApi;

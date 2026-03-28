/**
 * finnhub.js  —  Frontend market service (100% Finnhub via backend proxy)
 * =========================================================================
 * All calls go through your Express backend — API key never exposed to browser.
 *
 *  fetchQuote(symbol)                → live price data
 *  fetchCandles(symbol, res, days)   → OHLCV candlestick data
 *  fetchMarketStatus(exchange)       → market open/closed
 *  fetchMarketNews(symbol?, cat?)    → headlines
 *  fetchRecommendation(symbol)       → analyst ratings
 *  fetchCompanyProfile(symbol)       → name, logo, sector, exchange…
 *  fetchMetrics(symbol)              → PE, beta, 52w high/low, EPS, dividend…
 *  fetchOverview(symbol)             → profile + metrics combined
 *  fetchSymbols(exchange)            → full list of tradable equities
 *  fetchSearch(query)                → symbol auto-complete
 *  fetchSymbolVisibility(symbols)    → enabled/disabled status for user-facing symbols
 */

import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: `${BASE}/api/market`,
    timeout: 12000,
});

// ─── Live Price ───────────────────────────────────────────────────────────────
/**
 * @param {string} symbol  e.g. "AAPL"
 * @returns {{ c, d, dp, h, l, o, pc, t } | null}
 *   c=current, d=change, dp=%change, h/l=high/low, o=open, pc=prevClose, t=timestamp
 */
export const fetchQuote = async (symbol) => {
    try {
        const { data } = await api.get("/quote", { params: { symbol } });
        return data;
    } catch (err) {
        console.warn(`[finnhub] quote failed for ${symbol}:`, err.response?.data?.error ?? err.message);
        return null;
    }
};

// ─── Candlestick / OHLCV ─────────────────────────────────────────────────────
/**
 * @param {string} symbol
 * @param {"1"|"5"|"15"|"30"|"60"|"D"|"W"|"M"} resolution
 * @param {number} days   look-back window in calendar days
 * @returns {{ c, h, l, o, v, t, s } | null}
 *   Arrays of close/high/low/open/volume/timestamp  (s="ok"|"no_data"|"rate_limited")
 */
export const fetchCandles = async (symbol, resolution = "D", days = 90) => {
    try {
        const { data } = await api.get("/candle", { params: { symbol, resolution, days } });
        return data;
    } catch (err) {
        if (err.response?.status === 429) return { s: "rate_limited" };
        console.warn(`[finnhub] candle failed for ${symbol}:`, err.response?.data?.error ?? err.message);
        return null;
    }
};

// ─── Market Status ────────────────────────────────────────────────────────────
/**
 * @param {"US"|"LSE"|"TSX"} exchange
 * @returns {{ exchange, isOpen, holiday, session, t } | null}
 */
export const fetchMarketStatus = async (exchange = "US") => {
    try {
        const { data } = await api.get("/status", { params: { exchange } });
        return data;
    } catch (err) {
        console.warn("[finnhub] market status failed:", err.response?.data?.error ?? err.message);
        return null;
    }
};

// ─── News ─────────────────────────────────────────────────────────────────────
/**
 * @param {string|null} symbol   If set, fetches company news; else general market news
 * @param {string}      category "general" | "forex" | "crypto" | "merger"
 * @returns {Array}
 */
export const fetchMarketNews = async (symbol = null, category = "general") => {
    try {
        const params = symbol ? { symbol } : { category };
        const { data } = await api.get("/news", { params });
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn("[finnhub] news failed:", err.response?.data?.error ?? err.message);
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
        const { data } = await api.get("/recommendation", { params: { symbol } });
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn(`[finnhub] recommendation failed for ${symbol}:`, err.response?.data?.error ?? err.message);
        return [];
    }
};

// ─── Company Profile ──────────────────────────────────────────────────────────
/**
 * @param {string} symbol
 * @returns {{ name, ticker, exchange, ipo, marketCapitalization, logo, weburl,
 *             finnhubIndustry, currency, country, shareOutstanding } | null}
 */
export const fetchCompanyProfile = async (symbol) => {
    try {
        const { data } = await api.get("/profile", { params: { symbol } });
        return data;
    } catch (err) {
        console.warn(`[finnhub] profile failed for ${symbol}:`, err.response?.data?.error ?? err.message);
        return null;
    }
};

// ─── Basic Financials / Metrics ───────────────────────────────────────────────
/**
 * Returns Finnhub /stock/metric data (fundamentals).
 *
 * @param {string} symbol
 * @returns {{ metric: { peBasicExclExtraTTM, beta, 52WeekHigh, 52WeekLow,
 *             epsBasicExclExtraAnnual, dividendYieldIndicatedAnnual, ... } } | null}
 */
export const fetchMetrics = async (symbol) => {
    try {
        const { data } = await api.get("/metrics", { params: { symbol } });
        return data;
    } catch (err) {
        console.warn(`[finnhub] metrics failed for ${symbol}:`, err.response?.data?.error ?? err.message);
        return null;
    }
};

// ─── Earnings (includes EPS surprise) ──────────────────────────────────────
/**
 * @param {string} symbol
 * @returns {Array<{ actual, estimate, period, quarter, surprise, surprisePercent, year }>}
 */
export const fetchEarnings = async (symbol) => {
    try {
        const { data } = await api.get("/earnings", { params: { symbol } });
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn(`[finnhub] earnings failed for ${symbol}:`, err.response?.data?.error ?? err.message);
        return [];
    }
};

// ─── Overview (profile + metrics combined) ────────────────────────────────────
/**
 * Convenience helper that fetches both profile and metrics in one backend call.
 *
 * @param {string} symbol
 * @returns {{ ...profile, metrics: {...} } | null}
 */
export const fetchOverview = async (symbol) => {
    try {
        const { data } = await api.get("/overview", { params: { symbol } });
        return data;
    } catch (err) {
        console.warn(`[finnhub] overview failed for ${symbol}:`, err.response?.data?.error ?? err.message);
        return null;
    }
};

// ─── Symbol List ──────────────────────────────────────────────────────────────
/**
 * Returns all tradable Common Stock symbols for an exchange.
 *
 * @param {"US"|"LSE"|"TSX"} exchange
 * @returns {Array<{ symbol, description, type, currency, figi, ... }>}
 */
export const fetchSymbols = async (exchange = "US") => {
    try {
        const { data } = await api.get("/symbols", { params: { exchange } });
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn(`[finnhub] symbols failed for ${exchange}:`, err.response?.data?.error ?? err.message);
        return [];
    }
};

// ─── Symbol Search / Autocomplete ────────────────────────────────────────────
/**
 * @param {string} query  e.g. "apple" or "AAPL"
 * @returns {{ count, result: Array<{ description, displaySymbol, symbol, type }> }}
 */
export const fetchSearch = async (query) => {
    try {
        const { data } = await api.get("/search", { params: { q: query } });
        return data;
    } catch (err) {
        console.warn(`[finnhub] search failed for "${query}":`, err.response?.data?.error ?? err.message);
        return { count: 0, result: [] };
    }
};

export const fetchSymbolVisibility = async (symbols = []) => {
    try {
        if (!Array.isArray(symbols) || symbols.length === 0) return [];
        const { data } = await api.get('/visibility', {
            params: { symbols: symbols.join(',') }
        });
        return Array.isArray(data?.data) ? data.data : [];
    } catch (err) {
        console.warn('[finnhub] visibility failed:', err.response?.data?.message ?? err.message);
        return [];
    }
};

export default api;

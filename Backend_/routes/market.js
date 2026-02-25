/**
 * Market Data Proxy Routes
 * ========================
 * All Finnhub and Alpha Vantage API calls are made SERVER-SIDE here.
 * API keys never leave the backend environment.
 *
 * Feature → API mapping:
 *  - Live Price       → Finnhub  /api/market/quote
 *  - Market Status    → Finnhub  /api/market/status
 *  - News             → Finnhub  /api/market/news
 *  - Recommendations  → Finnhub  /api/market/recommendation
 *  - Historical Graph → Alpha Vantage /api/market/history
 *  - Technical Inds.  → Alpha Vantage /api/market/indicator
 *  - Company Financials → Alpha Vantage /api/market/overview
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// ─── Simple In-Memory Cache (24h TTL for Alpha Vantage data) ─────────────────
// AV free plan = 25 requests/day. Cache prevents re-fetching same data.
const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCached(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}
const finnhubClient = axios.create({
    baseURL: "https://finnhub.io/api/v1",
    timeout: 8000,
});

const avClient = axios.create({
    baseURL: "https://www.alphavantage.co",
    timeout: 12000,  // AV can be slow
});

// ─── Shared error helper ───────────────────────────────────────────────────────
function handleProxyError(res, error, label) {
    const status = error.response?.status;
    if (status === 403 || status === 401) {
        return res.status(503).json({ error: "Data provider rejected request. Check API key." });
    }
    if (status === 429) {
        return res.status(429).json({ error: "Rate limit reached. Please wait and retry." });
    }
    console.error(`[MarketProxy] ${label}:`, error.message);
    return res.status(502).json({ error: "Failed to fetch market data." });
}

// ─────────────────────────────────────────────────────────────────────────────
// FINNHUB ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/market/quote?symbol=AAPL
 * Live price, change, percent change
 */
router.get("/quote", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });
    try {
        const { data } = await finnhubClient.get("/quote", {
            params: { symbol, token: FINNHUB_KEY }
        });
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, `quote:${symbol}`);
    }
});

/**
 * GET /api/market/candle?symbol=AAPL&resolution=D&days=30
 * Price candles (OHLCV) — used inside dashboard for the small sparklines on watchlist
 */
router.get("/candle", async (req, res) => {
    const { symbol, resolution = "D", days = 30 } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });

    const cacheKey = `candle:${symbol.toUpperCase()}`;

    // Serve from cache if available (saves AV quota)
    const cached = getCached(cacheKey);
    if (cached) {
        // Slice to requested days from cached full data
        const daysNum = Number(days);
        const sliced = {
            s: cached.s,
            c: cached.c.slice(-Math.max(daysNum, 30)),
            h: cached.h.slice(-Math.max(daysNum, 30)),
            l: cached.l.slice(-Math.max(daysNum, 30)),
            o: cached.o.slice(-Math.max(daysNum, 30)),
            v: cached.v.slice(-Math.max(daysNum, 30)),
            t: cached.t.slice(-Math.max(daysNum, 30)),
        };
        return res.json(sliced);
    }

    try {
        // Use Alpha Vantage TIME_SERIES_DAILY (free plan supports this)
        // Finnhub /stock/candle requires a paid plan
        const { data } = await avClient.get("/query", {
            params: {
                function: "TIME_SERIES_DAILY",
                symbol,
                outputsize: "compact", // last 100 trading days
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        if (data["Error Message"]) {
            return res.status(400).json({ error: "Invalid symbol", detail: data["Error Message"] });
        }
        if (data["Note"] || data["Information"]) {
            // Rate-limited: return 429 with rate_limited flag so frontend can show friendly message
            return res.status(429).json({ error: "Chart data temporarily unavailable. Daily quota reached — data resets at midnight UTC.", code: "RATE_LIMITED" });
        }

        const timeSeries = data["Time Series (Daily)"];
        if (!timeSeries) {
            return res.json({ s: "no_data", c: [], h: [], l: [], o: [], v: [], t: [] });
        }

        // Convert AV format to Finnhub candle format: {c,h,l,o,v,t,s}
        const entries = Object.entries(timeSeries)
            .sort(([a], [b]) => new Date(a) - new Date(b)); // ascending date

        const c = [], h = [], l = [], o = [], v = [], t = [];
        entries.forEach(([date, vals]) => {
            c.push(parseFloat(vals["4. close"]));
            h.push(parseFloat(vals["2. high"]));
            l.push(parseFloat(vals["3. low"]));
            o.push(parseFloat(vals["1. open"]));
            v.push(parseFloat(vals["5. volume"]));
            t.push(Math.floor(new Date(date).getTime() / 1000));
        });

        const result = { s: "ok", c, h, l, o, v, t };

        // Cache the full dataset — slicing happens per-request above
        setCached(cacheKey, result);

        const daysNum = Number(days);
        return res.json({
            ...result,
            c: c.slice(-Math.max(daysNum, 30)),
            h: h.slice(-Math.max(daysNum, 30)),
            l: l.slice(-Math.max(daysNum, 30)),
            o: o.slice(-Math.max(daysNum, 30)),
            v: v.slice(-Math.max(daysNum, 30)),
            t: t.slice(-Math.max(daysNum, 30)),
        });
    } catch (err) {
        return handleProxyError(res, err, `candle:${symbol}`);
    }
});


/**
 * GET /api/market/status?exchange=US
 * Market open/closed status
 */
router.get("/status", async (req, res) => {
    const { exchange = "US" } = req.query;
    try {
        const { data } = await finnhubClient.get("/stock/market-status", {
            params: { exchange, token: FINNHUB_KEY }
        });
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, "market-status");
    }
});

/**
 * GET /api/market/news?category=general
 * Market news headlines
 */
router.get("/news", async (req, res) => {
    const { category = "general", symbol, minId = 0 } = req.query;
    try {
        let endpoint, params;
        if (symbol) {
            // Company-specific news — requires from/to dates
            const to = new Date().toISOString().split("T")[0];
            const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
            endpoint = "/company-news";
            params = { symbol, from, to, token: FINNHUB_KEY };
        } else {
            endpoint = "/news";
            params = { category, minId, token: FINNHUB_KEY };
        }
        const { data } = await finnhubClient.get(endpoint, { params });
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, "news");
    }
});

/**
 * GET /api/market/recommendation?symbol=AAPL
 * Analyst buy/sell/hold recommendations
 */
router.get("/recommendation", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });
    try {
        const { data } = await finnhubClient.get("/stock/recommendation", {
            params: { symbol, token: FINNHUB_KEY }
        });
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, `recommendation:${symbol}`);
    }
});

/**
 * GET /api/market/profile?symbol=AAPL
 * Basic company profile from Finnhub (name, sector, logo)
 */
router.get("/profile", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });
    try {
        const { data } = await finnhubClient.get("/stock/profile2", {
            params: { symbol, token: FINNHUB_KEY }
        });
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, `profile:${symbol}`);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ALPHA VANTAGE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/market/history?symbol=AAPL&period=daily|weekly|monthly
 * Daily/weekly/monthly OHLCV data for historical charts
 */
router.get("/history", async (req, res) => {
    const { symbol, period = "daily", outputsize = "compact" } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });

    const functionMap = {
        daily: "TIME_SERIES_DAILY",
        weekly: "TIME_SERIES_WEEKLY",
        monthly: "TIME_SERIES_MONTHLY"
    };
    const avFunction = functionMap[period] || "TIME_SERIES_DAILY";

    try {
        const { data } = await avClient.get("/query", {
            params: {
                function: avFunction,
                symbol,
                outputsize, // "compact" = last 100 days, "full" = 20+ years
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        if (data["Error Message"]) {
            return res.status(400).json({ error: "Invalid symbol", detail: data["Error Message"] });
        }
        if (data["Note"] || data["Information"]) {
            return res.status(429).json({ error: "Alpha Vantage rate limit reached. Free plan: 25 req/day." });
        }
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, `history:${symbol}`);
    }
});

/**
 * GET /api/market/indicator?symbol=AAPL&indicator=RSI&interval=daily&period=14
 * Technical indicator values (RSI, MACD, SMA, EMA, BBANDS, etc.)
 */
router.get("/indicator", async (req, res) => {
    const { symbol, indicator = "RSI", interval = "daily", period = 14, series_type = "close" } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });

    try {
        const { data } = await avClient.get("/query", {
            params: {
                function: indicator.toUpperCase(),
                symbol,
                interval,
                time_period: period,
                series_type,
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        if (data["Error Message"]) {
            return res.status(400).json({ error: "Invalid indicator or symbol", detail: data["Error Message"] });
        }
        if (data["Note"] || data["Information"]) {
            return res.status(429).json({ error: "Alpha Vantage rate limit reached. Free plan: 25 req/day." });
        }
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, `indicator:${symbol}:${indicator}`);
    }
});

/**
 * GET /api/market/overview?symbol=AAPL
 * Company fundamentals: PE ratio, EPS, market cap, revenue, profit margin, etc.
 */
router.get("/overview", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });

    try {
        const { data } = await avClient.get("/query", {
            params: {
                function: "OVERVIEW",
                symbol,
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        if (data["Error Message"]) {
            return res.status(400).json({ error: "Invalid symbol", detail: data["Error Message"] });
        }
        if (data["Note"] || data["Information"]) {
            return res.status(429).json({ error: "Alpha Vantage rate limit reached. Free plan: 25 req/day." });
        }
        // Empty response = symbol not found
        if (!data.Symbol) {
            return res.status(404).json({ error: "No data found for symbol" });
        }
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, `overview:${symbol}`);
    }
});

/**
 * GET /api/market/earnings?symbol=AAPL
 * Annual & quarterly EPS from Alpha Vantage
 */
router.get("/earnings", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol query param is required" });

    try {
        const { data } = await avClient.get("/query", {
            params: { function: "EARNINGS", symbol, apikey: ALPHA_VANTAGE_KEY }
        });

        if (data["Error Message"]) {
            return res.status(400).json({ error: "Invalid symbol", detail: data["Error Message"] });
        }
        if (data["Note"] || data["Information"]) {
            return res.status(429).json({ error: "Alpha Vantage rate limit reached." });
        }
        return res.json(data);
    } catch (err) {
        return handleProxyError(res, err, `earnings:${symbol}`);
    }
});

module.exports = router;

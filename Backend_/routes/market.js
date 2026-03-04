const express = require("express");
const axios = require("axios");
const router = express.Router();
const StockCache = require("../models/StockCache");

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

// ─── Cache TTL Settings (milliseconds) ─────────────────────────────────────
// Uses MongoDB StockCache model with TTL auto-expiration.
// In-memory Map acts as L1 (hot) cache; MongoDB as L2 (persistent) cache.
const memCache = new Map();
const TTL = {
    quote: 30 * 1000,            // 30 seconds  – prices change fast
    candle: 5 * 60 * 1000,       // 5 minutes   – candle data
    profile: 24 * 60 * 60 * 1000, // 24 hours   – company details barely change
    metrics: 60 * 60 * 1000,     // 1 hour      – fundamentals
    symbols: 24 * 60 * 60 * 1000, // 24 hours   – symbol list
    status: 60 * 1000,           // 1 minute    – market status
    news: 5 * 60 * 1000,         // 5 minutes   – news
    recommendation: 60 * 60 * 1000, // 1 hour
    earnings: 60 * 60 * 1000,    // 1 hour
    search: 5 * 60 * 1000,       // 5 minutes
};

// L1 (in-memory) check, then L2 (MongoDB) check
async function getCached(key) {
    // L1: hot memory cache
    const mem = memCache.get(key);
    if (mem && Date.now() - mem.ts < mem.ttl) return mem.data;

    // L2: persistent MongoDB cache
    try {
        const data = await StockCache.getCached(key);
        if (data) {
            memCache.set(key, { data, ts: Date.now(), ttl: 30000 }); // warm L1
            return data;
        }
    } catch (e) { /* MongoDB down — just miss the cache */ }
    return null;
}

// Write to both L1 and L2
async function setCached(key, data, dataType, ttl) {
    memCache.set(key, { data, ts: Date.now(), ttl });
    try {
        await StockCache.setCached(key, data, dataType, ttl);
    } catch (e) { /* MongoDB write failed — L1 still works */ }
}

// ─── Finnhub HTTP client ─────────────────────────────────────────────────────
const fh = axios.create({
    baseURL: "https://finnhub.io/api/v1",
    timeout: 10000,
});

// ─── Shared error helper ─────────────────────────────────────────────────────
function proxyError(res, err, label) {
    const status = err.response?.status;
    console.error(`[market] ${label}:`, err.message);
    if (status === 401 || status === 403)
        return res.status(503).json({ error: "Finnhub rejected the request. Check API key." });
    if (status === 429)
        return res.status(429).json({ error: "Finnhub rate limit reached. Please wait." });
    return res.status(502).json({ error: "Failed to fetch market data." });
}

// ─────────────────────────────────────────────────────────────────
// GET /api/market/quote?symbol=AAPL
// ─────────────────────────────────────────────────────────────────
router.get("/quote", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const key = `quote:${symbol.toUpperCase()}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        const { data } = await fh.get("/quote", { params: { symbol, token: FINNHUB_KEY } });
        await setCached(key, data, "quote", TTL.quote);
        return res.json(data);
    } catch (err) { return proxyError(res, err, `quote:${symbol}`); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/candle?symbol=AAPL&resolution=D&days=90
// resolution: 1 | 5 | 15 | 30 | 60 | D | W | M
//
// 3-tier fallback strategy (most reliable free setup):
//   1. Finnhub  /stock/candle  — works on paid plan, skip on 403
//   2. Alpha Vantage           — works on free plan, skip on rate limit
//   3. Yahoo Finance           — completely free, no key, no rate limit ✅
// ─────────────────────────────────────────────────────────────────
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const av = axios.create({ baseURL: "https://www.alphavantage.co", timeout: 15000 });
const yf = axios.create({ baseURL: "https://query1.finance.yahoo.com", timeout: 12000 });
const yf2 = axios.create({ baseURL: "https://query2.finance.yahoo.com", timeout: 12000 });

// ── Tier 2: Alpha Vantage ────────────────────────────────────────
async function candleFromAlphaVantage(symbol, resolution, days) {
    const funcMap = { D: "TIME_SERIES_DAILY", W: "TIME_SERIES_WEEKLY", M: "TIME_SERIES_MONTHLY" };
    const avFunc = funcMap[resolution] || "TIME_SERIES_DAILY";
    const outputsize = days > 100 ? "full" : "compact";

    const { data } = await av.get("/query", {
        params: { function: avFunc, symbol, outputsize, apikey: ALPHA_VANTAGE_KEY }
    });

    if (data["Error Message"]) throw new Error("Invalid symbol: " + data["Error Message"]);
    if (data["Note"] || data["Information"]) {
        const err = new Error("RATE_LIMITED"); err.code = "RATE_LIMITED"; throw err;
    }

    const seriesKey = Object.keys(data).find(k => k.startsWith("Time Series") || k.startsWith("Weekly") || k.startsWith("Monthly"));
    if (!seriesKey) return null;

    const entries = Object.entries(data[seriesKey]).sort(([a], [b]) => new Date(a) - new Date(b));
    const c = [], h = [], l = [], o = [], v = [], t = [];
    entries.forEach(([date, vals]) => {
        c.push(parseFloat(vals["4. close"]));
        h.push(parseFloat(vals["2. high"]));
        l.push(parseFloat(vals["3. low"]));
        o.push(parseFloat(vals["1. open"]));
        v.push(parseInt(vals["5. volume"], 10));
        t.push(Math.floor(new Date(date).getTime() / 1000));
    });

    const n = Math.max(Number(days), 30);
    return { s: "ok", c: c.slice(-n), h: h.slice(-n), l: l.slice(-n), o: o.slice(-n), v: v.slice(-n), t: t.slice(-n) };
}

// ── Tier 3: Yahoo Finance (free, no key, unlimited) ───────────────
async function candleFromYahoo(symbol, resolution, days) {
    // Map resolution → Yahoo interval & range
    const intervalMap = {
        "1": "1m", "5": "5m", "15": "15m", "30": "30m", "60": "60m",
        "D": "1d", "W": "1wk", "M": "1mo"
    };
    const interval = intervalMap[resolution] || "1d";

    // Yahoo range based on days requested
    let range;
    if (days <= 5) range = "5d";
    else if (days <= 30) range = "1mo";
    else if (days <= 90) range = "3mo";
    else if (days <= 180) range = "6mo";
    else if (days <= 365) range = "1y";
    else range = "2y";

    // Try query1 first, fallback to query2
    let data;
    try {
        const r = await yf.get(`/v8/finance/chart/${encodeURIComponent(symbol)}`, {
            params: { interval, range, includePrePost: false },
            headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
        });
        data = r.data;
    } catch {
        const r = await yf2.get(`/v8/finance/chart/${encodeURIComponent(symbol)}`, {
            params: { interval, range, includePrePost: false },
            headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
        });
        data = r.data;
    }

    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const rawClose = quotes.close || [];
    const rawHigh = quotes.high || [];
    const rawLow = quotes.low || [];
    const rawOpen = quotes.open || [];
    const rawVolume = quotes.volume || [];

    // Filter out null candles (market closure gaps)
    const c = [], h = [], l = [], o = [], v = [], t = [];
    for (let i = 0; i < timestamps.length; i++) {
        if (rawClose[i] == null) continue;
        t.push(timestamps[i]);
        c.push(rawClose[i]);
        h.push(rawHigh[i] ?? rawClose[i]);
        l.push(rawLow[i] ?? rawClose[i]);
        o.push(rawOpen[i] ?? rawClose[i]);
        v.push(rawVolume[i] ?? 0);
    }

    if (c.length === 0) return null;
    return { s: "ok", c, h, l, o, v, t };
}

// ── Candle route ──────────────────────────────────────────────────
router.get("/candle", async (req, res) => {
    const { symbol, resolution = "D", days = 90 } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const key = `candle:${symbol.toUpperCase()}:${resolution}:${days}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    // ── Tier 1: Finnhub (paid plan only) ─────────────────────────
    try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - Number(days) * 24 * 60 * 60;
        const { data } = await fh.get("/stock/candle", {
            params: { symbol, resolution, from, to, token: FINNHUB_KEY }
        });
        if (data.s === "ok" && data.c?.length > 0) {
            await setCached(key, data, "candle", TTL.candle);
            console.log(`[candle] ✅ Finnhub: ${symbol}`);
            return res.json(data);
        }
    } catch (fhErr) {
        if (fhErr.response?.status !== 403 && fhErr.response?.status !== 401) {
            console.warn(`[candle] Finnhub failed for ${symbol}: ${fhErr.message}`);
        }
    }

    // ── Tier 2: Alpha Vantage (free plan, 25 req/day) ─────────────
    try {
        const result = await candleFromAlphaVantage(symbol, resolution, days);
        if (result?.c?.length > 0) {
            await setCached(key, result, "candle", TTL.candle);
            console.log(`[candle] ✅ Alpha Vantage: ${symbol}`);
            return res.json(result);
        }
    } catch (avErr) {
        if (avErr.code !== "RATE_LIMITED") {
            console.warn(`[candle] Alpha Vantage failed for ${symbol}: ${avErr.message}`);
        } else {
            console.log(`[candle] AV rate limited, trying Yahoo Finance for ${symbol}…`);
        }
    }

    // ── Tier 3: Yahoo Finance (always free, no key) ───────────────
    try {
        const result = await candleFromYahoo(symbol, resolution, days);
        if (result?.c?.length > 0) {
            await setCached(key, result, "candle", TTL.candle);
            console.log(`[candle] ✅ Yahoo Finance: ${symbol} (${result.c.length} bars)`);
            return res.json(result);
        }
        return res.json({ s: "no_data", c: [], h: [], l: [], o: [], v: [], t: [] });
    } catch (yfErr) {
        console.error(`[candle] Yahoo Finance failed for ${symbol}: ${yfErr.message}`);
        return res.status(502).json({ error: "All chart data sources unavailable. Please try again." });
    }
});



// ─────────────────────────────────────────────────────────────────
// GET /api/market/status?exchange=US
// ─────────────────────────────────────────────────────────────────
router.get("/status", async (req, res) => {
    const { exchange = "US" } = req.query;
    const key = `status:${exchange}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        const { data } = await fh.get("/stock/market-status", {
            params: { exchange, token: FINNHUB_KEY }
        });
        await setCached(key, data, "status", TTL.status);
        return res.json(data);
    } catch (err) { return proxyError(res, err, "market-status"); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/news?category=general
// GET /api/market/news?symbol=AAPL  (company news)
// ─────────────────────────────────────────────────────────────────
router.get("/news", async (req, res) => {
    const { category = "general", symbol } = req.query;
    const key = symbol ? `news:${symbol.toUpperCase()}` : `news:${category}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        let endpoint, params;
        if (symbol) {
            const to = new Date().toISOString().split("T")[0];
            const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
            endpoint = "/company-news";
            params = { symbol, from, to, token: FINNHUB_KEY };
        } else {
            endpoint = "/news";
            params = { category, token: FINNHUB_KEY };
        }
        const { data } = await fh.get(endpoint, { params });
        await setCached(key, data, "news", TTL.news);
        return res.json(data);
    } catch (err) { return proxyError(res, err, "news"); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/recommendation?symbol=AAPL
// ─────────────────────────────────────────────────────────────────
router.get("/recommendation", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const key = `rec:${symbol.toUpperCase()}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        const { data } = await fh.get("/stock/recommendation", {
            params: { symbol, token: FINNHUB_KEY }
        });
        await setCached(key, data, "recommendation", TTL.recommendation);
        return res.json(data);
    } catch (err) { return proxyError(res, err, `recommendation:${symbol}`); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/profile?symbol=AAPL
// ─────────────────────────────────────────────────────────────────
router.get("/profile", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const key = `profile:${symbol.toUpperCase()}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        const { data } = await fh.get("/stock/profile2", {
            params: { symbol, token: FINNHUB_KEY }
        });
        await setCached(key, data, "profile", TTL.profile);
        return res.json(data);
    } catch (err) { return proxyError(res, err, `profile:${symbol}`); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/metrics?symbol=AAPL
// Returns basic financials: PE, beta, 52w high/low, EPS, dividend, etc.
// ─────────────────────────────────────────────────────────────────
router.get("/metrics", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const key = `metrics:${symbol.toUpperCase()}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        const { data } = await fh.get("/stock/metric", {
            params: { symbol, metric: "all", token: FINNHUB_KEY }
        });
        await setCached(key, data, "metrics", TTL.metrics);
        return res.json(data);
    } catch (err) { return proxyError(res, err, `metrics:${symbol}`); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/overview?symbol=AAPL
// Convenience: profile + metrics combined in one call
// ─────────────────────────────────────────────────────────────────
router.get("/overview", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const key = `overview:${symbol.toUpperCase()}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        const [profileRes, metricsRes] = await Promise.all([
            fh.get("/stock/profile2", { params: { symbol, token: FINNHUB_KEY } }),
            fh.get("/stock/metric", { params: { symbol, metric: "all", token: FINNHUB_KEY } }),
        ]);
        const combined = {
            ...profileRes.data,
            metrics: metricsRes.data?.metric || {},
        };
        await setCached(key, combined, "overview", TTL.profile);
        return res.json(combined);
    } catch (err) { return proxyError(res, err, `overview:${symbol}`); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/symbols?exchange=US
// Returns the full list of tradable US equity symbols from Finnhub.
// Cached 24 hours (data barely changes).
// ─────────────────────────────────────────────────────────────────
router.get("/symbols", async (req, res) => {
    const { exchange = "US" } = req.query;
    const key = `symbols:${exchange}`;
    const cached = await getCached(key);
    if (cached) return res.json(cached);

    try {
        const { data } = await fh.get("/stock/symbol", {
            params: { exchange, token: FINNHUB_KEY }
        });
        // data is an array of { symbol, description, type, currency, ... }
        // Filter to common stock only, remove empty symbols
        const filtered = (Array.isArray(data) ? data : [])
            .filter(s => s.type === "Common Stock" && s.symbol && !s.symbol.includes("."));
        await setCached(key, filtered, "symbols", TTL.symbols);
        return res.json(filtered);
    } catch (err) { return proxyError(res, err, `symbols:${exchange}`); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/market/search?q=apple
// Symbol search / autocomplete using Finnhub
// ─────────────────────────────────────────────────────────────────
router.get("/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "q (query) is required" });

    try {
        const { data } = await fh.get("/search", {
            params: { q, token: FINNHUB_KEY }
        });
        return res.json(data);
    } catch (err) { return proxyError(res, err, `search:${q}`); }
});

// ─────────────────────────────────────────────────────────────────
// Backwards-compat stubs (were Alpha Vantage routes)
// ─────────────────────────────────────────────────────────────────
router.get("/history", (req, res) => {
    // Redirect callers to the candle endpoint
    req.query.resolution = req.query.resolution || "D";
    req.query.days = req.query.days || 90;
    return res.redirect(`/api/market/candle?symbol=${req.query.symbol}&resolution=${req.query.resolution}&days=${req.query.days}`);
});

router.get("/indicator", (req, res) => {
    // Technical indicators are now computed client-side from candle data
    return res.status(410).json({ error: "Indicators are now calculated client-side from /api/market/candle data." });
});

router.get("/earnings", async (req, res) => {
    // Finnhub has earnings too
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });
    try {
        const { data } = await fh.get("/stock/earnings", {
            params: { symbol, token: FINNHUB_KEY }
        });
        return res.json(data);
    } catch (err) { return proxyError(res, err, `earnings:${symbol}`); }
});

module.exports = router;

/**
 * alphaVantage.js  —  Frontend Alpha Vantage service (via backend proxy)
 * =======================================================================
 * ✅ Historical Graph  /api/market/history   (TIME_SERIES_DAILY/WEEKLY/MONTHLY)
 * ✅ Technical Indicators /api/market/indicator (RSI, MACD, SMA, EMA, BBANDS…)
 * ✅ Company Financials   /api/market/overview  (PE, EPS, MarketCap, revenue…)
 * ✅ Earnings             /api/market/earnings  (annual + quarterly EPS)
 *
 * All calls go to your Express backend — NO Alpha Vantage key in browser.
 *
 * ⚠️  Alpha Vantage Free Plan Limits:
 *     - 25 API requests / day
 *     - 5 requests / minute
 *     Use sparingly; responses are cached on the backend side (future improvement).
 */

import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const avApi = axios.create({
    baseURL: `${BASE}/api/market`,
    timeout: 15000,  // AV can be slow on free plan
});

// ─── Historical OHLCV Data ────────────────────────────────────────────────────
/**
 * Fetches daily/weekly/monthly candlestick data from Alpha Vantage.
 * Use this for the main price chart (NOT Finnhub candles which are small-window only).
 *
 * @param {string} symbol             e.g. "AAPL"
 * @param {"daily"|"weekly"|"monthly"} period
 * @param {"compact"|"full"} outputsize  "compact" = last 100 bars, "full" = 20+ years
 * @returns {{ timeSeries: { date: string, open, high, low, close, volume }[] } | null}
 */
export const fetchHistory = async (symbol, period = "daily", outputsize = "compact") => {
    try {
        const { data } = await avApi.get("/history", { params: { symbol, period, outputsize } });

        // Normalize AV's key format: "Time Series (Daily)" → flat array
        const seriesKey = Object.keys(data).find(k => k.startsWith("Time Series") || k.startsWith("Weekly") || k.startsWith("Monthly"));
        if (!seriesKey) return null;

        const raw = data[seriesKey];
        const timeSeries = Object.entries(raw)
            .map(([date, values]) => ({
                date,
                open: parseFloat(values["1. open"]),
                high: parseFloat(values["2. high"]),
                low: parseFloat(values["3. low"]),
                close: parseFloat(values["4. close"]),
                volume: parseInt(values["5. volume"], 10),
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // oldest → newest

        return { timeSeries, meta: data["Meta Data"] ?? {} };
    } catch (error) {
        if (error.response?.status === 429) {
            console.warn("[alphaVantage] Rate limit hit (25 req/day on free plan)");
        } else {
            console.warn(`[alphaVantage] history failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        }
        return null;
    }
};

// ─── Technical Indicators ─────────────────────────────────────────────────────
/**
 * Fetch a single technical indicator.
 *
 * @param {string} symbol
 * @param {string} indicator  AV function name: "RSI" | "MACD" | "SMA" | "EMA" | "BBANDS" | "STOCH" | "ADX" | "CCI"
 * @param {"daily"|"weekly"|"monthly"|"60min"} interval
 * @param {number} period     time_period (e.g. 14 for RSI, 26 for MACD)
 * @param {"close"|"open"|"high"|"low"} series_type
 * @returns {{ values: { date: string, [key]: string }[] } | null}
 */
export const fetchIndicator = async (symbol, indicator = "RSI", interval = "daily", period = 14, series_type = "close") => {
    try {
        const { data } = await avApi.get("/indicator", {
            params: { symbol, indicator, interval, period, series_type }
        });

        // Find the actual time series key in response
        const seriesKey = Object.keys(data).find(k => k.startsWith("Technical Analysis"));
        if (!seriesKey) return null;

        const raw = data[seriesKey];
        const values = Object.entries(raw)
            .map(([date, vals]) => ({ date, ...vals }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return { values, indicator: data["Meta Data"]?.["2: Indicator"] ?? indicator };
    } catch (error) {
        if (error.response?.status === 429) {
            console.warn("[alphaVantage] Rate limit hit (25 req/day on free plan)");
        } else {
            console.warn(`[alphaVantage] ${indicator} failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        }
        return null;
    }
};

// ─── Company Financials / Fundamentals ───────────────────────────────────────
/**
 * Fetch company overview: PE ratio, EPS, market cap, revenue, profit margin,
 * beta, 52-week high/low, dividend yield, sector, industry, description, etc.
 *
 * @param {string} symbol
 * @returns {Object | null}  Full AV OVERVIEW response object
 *
 * Key fields returned:
 *   Symbol, Name, Sector, Industry, Description,
 *   MarketCapitalization, PERatio, EPS, DividendYield,
 *   52WeekHigh, 52WeekLow, Beta, ProfitMargin,
 *   RevenuePerShareTTM, ReturnOnEquityTTM, AnalystTargetPrice, ...
 */
export const fetchCompanyOverview = async (symbol) => {
    try {
        const { data } = await avApi.get("/overview", { params: { symbol } });
        return data;
    } catch (error) {
        if (error.response?.status === 429) {
            console.warn("[alphaVantage] Rate limit hit (25 req/day on free plan)");
        } else {
            console.warn(`[alphaVantage] overview failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        }
        return null;
    }
};

// ─── Earnings Data ────────────────────────────────────────────────────────────
/**
 * Fetch annual and quarterly EPS (earnings per share) history.
 *
 * @param {string} symbol
 * @returns {{ annualEarnings: Array, quarterlyEarnings: Array } | null}
 */
export const fetchEarnings = async (symbol) => {
    try {
        const { data } = await avApi.get("/earnings", { params: { symbol } });
        return {
            annualEarnings: data.annualEarnings ?? [],
            quarterlyEarnings: data.quarterlyEarnings ?? [],
        };
    } catch (error) {
        if (error.response?.status === 429) {
            console.warn("[alphaVantage] Rate limit hit (25 req/day on free plan)");
        } else {
            console.warn(`[alphaVantage] earnings failed for ${symbol}:`, error.response?.data?.error ?? error.message);
        }
        return null;
    }
};

export default avApi;

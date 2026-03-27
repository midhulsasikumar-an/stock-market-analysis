/**
 * marketDataService.js — Dashboard market overview data
 * ========================================================
 * Uses the backend proxy (finnhub) to:
 *  - Fetch live quotes for US large-cap stocks (market breadth)
 *  - Fetch market open/closed status
 *  - Calculate breadth, momentum, watchlist alpha
 *
 * NOTE: Indian NSE (.NS) and index symbols (^NSEI, ^BSESN, ^INDIAVIX)
 * are NOT available on the Finnhub free plan. We use US indices instead:
 *   NIFTY  → SPY (S&P 500 ETF)
 *   SENSEX → DIA (Dow Jones ETF)
 *   VIX    → ^VIX (CBOE VIX)
 */

import { fetchQuote, fetchMarketStatus } from "./finnhub";

// US large-cap sample for market breadth calculation (free plan symbols)
const BREADTH_SYMBOLS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
    "META", "TSLA", "BRK.B", "JPM", "V"
];

/**
 * Fetch data with graceful per-symbol failure handling
 * @param {string[]} symbols
 * @returns {Promise<{ symbol: string, data: object|null }[]>}
 */
const fetchQuotesBatch = async (symbols) => {
    const results = await Promise.allSettled(
        symbols.map(async (symbol) => {
            const data = await fetchQuote(symbol);
            return { symbol, data };
        })
    );
    return results.map((r) =>
        r.status === "fulfilled" ? r.value : { symbol: null, data: null }
    );
};

/**
 * Main entry point — called by Market_Overview_Dash component
 * @param {string[]} watchlistSymbols
 * @returns {Promise<Object>}
 */
export const getMarketSnapshotData = async (watchlistSymbols = []) => {
    try {
        // 1. Fetch US proxy indices (SPY, DIA, ^VIX) + market status in parallel
        const [spyData, diaData, vixData, marketStatus] = await Promise.all([
            fetchQuote("SPY"),
            fetchQuote("DIA"),
            fetchQuote("^VIX"),
            fetchMarketStatus("US"),
        ]);

        const data = {
            // Renamed to US equivalents but kept API shape for component compatibility
            nifty: spyData,    // SPY (S&P 500 ETF) used as main index
            sensex: diaData,    // DIA (Dow Jones ETF)
            vix: vixData,    // CBOE VIX
            marketStatus,        // { isOpen, exchange, session }
            breadth: { advancers: 0, decliners: 0, unchanged: 0, total: 0 },
            momentum: "N/A",
            watchlistAlpha: null,
            rateLimited: false,
        };

        // 2. Market Breadth (US large-cap sample)
        const breadthResults = await fetchQuotesBatch(BREADTH_SYMBOLS);
        breadthResults.forEach(({ data: q }) => {
            if (!q || !q.c) return;
            data.breadth.total++;
            if (q.d > 0) data.breadth.advancers++;
            else if (q.d < 0) data.breadth.decliners++;
            else data.breadth.unchanged++;
        });

        // 3. Momentum (based on SPY % change)
        if (spyData?.dp !== undefined) {
            const pct = Math.abs(spyData.dp);
            if (pct < 0.3) data.momentum = "Low Momentum";
            else if (pct <= 1.0) data.momentum = "Moderate Momentum";
            else data.momentum = "High Momentum";
        }

        // 4. Watchlist Alpha (avg watchlist return vs SPY)
        if (watchlistSymbols.length > 0 && spyData?.dp !== undefined) {
            const wlResults = await fetchQuotesBatch(watchlistSymbols);
            let total = 0, count = 0;
            wlResults.forEach(({ data: q }) => {
                if (q?.dp !== undefined) { total += q.dp; count++; }
            });
            if (count > 0) {
                const avg = total / count;
                const alpha = avg - spyData.dp;
                data.watchlistAlpha = {
                    avgChange: avg,
                    alpha,
                    label: alpha >= 0 ? "Outperforming Market" : "Underperforming Market",
                };
            }
        }

        // 5. Generate Session overview text
        data.overview = generateOverviewText(data);

        return data;
    } catch (error) {
        console.error("[marketDataService] Critical error:", error.message);
        return { error: "Failed to fetch market data", rateLimited: false };
    }
};

const generateOverviewText = (data) => {
    if (!data.nifty || !data.vix) return "Market data currently unavailable.";
    const momentum = data.momentum.toLowerCase();
    const breadthStatus =
        data.breadth.advancers > data.breadth.decliners ? "positive breadth" : "mixed participation";
    const vixValue = data.vix.c;
    let vixStatus = "moderate volatility";
    if (vixValue < 15) vixStatus = "calm environment";
    else if (vixValue > 25) vixStatus = "elevated risk";
    return `Markets show ${momentum} with ${breadthStatus} and ${vixStatus}.`;
};

export const getVixClassification = (value) => {
    if (value < 15) return { label: "Calm", class: "text-success" };
    if (value <= 25) return { label: "Normal", class: "text-warning" };
    return { label: "High Risk", class: "text-danger" };
};

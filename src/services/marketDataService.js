import finnhub from "./finnhub";

// Constants
const NIFTY_50_SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
    "BHARTIARTL.NS", "ITC.NS", "SBIN.NS", "LICI.NS", "HINDUNILVR.NS"
]; // Subset for breath calculation to manage rate limits

/**
 * Fetch data with rate limit handling using Promise.allSettled
 * @param {Array<string>} symbols 
 * @returns {Promise<Array>}
 */
const fetchQuotesWithRateLimit = async (symbols) => {
    const promises = symbols.map(symbol =>
        finnhub.get("/quote", { params: { symbol } })
            .then(res => ({ symbol, status: "success", data: res.data }))
            .catch(error => ({ symbol, status: "error", error }))
    );
    return await Promise.allSettled(promises);
};

export const getMarketSnapshotData = async (watchlistSymbols = []) => {
    try {
        // 1. Fetch Basic Indices & VIX
        const mainSymbols = ["^NSEI", "^BSESN", "^INDIAVIX"];
        const mainResults = await Promise.allSettled(
            mainSymbols.map(s => finnhub.get("/quote", { params: { symbol: s } }))
        );

        const data = {
            nifty: mainResults[0].status === "fulfilled" ? mainResults[0].value.data : null,
            sensex: mainResults[1].status === "fulfilled" ? mainResults[1].value.data : null,
            vix: mainResults[2].status === "fulfilled" ? mainResults[2].value.data : null,
            breadth: { advancers: 0, decliners: 0, total: 0 },
            momentum: "N/A",
            watchlistAlpha: null,
            rateLimited: false
        };

        // Check if any main call failed due to rate limiting (429)
        if (mainResults.some(r => r.status === "rejected" && r.reason?.response?.status === 429)) {
            data.rateLimited = true;
        }

        // 2. Fetch Breadth Data (NIFTY 50 subset)
        const breadthResults = await fetchQuotesWithRateLimit(NIFTY_50_SYMBOLS);

        breadthResults.forEach(res => {
            const result = res.value; // allSettled value
            if (result && result.status === "success" && result.data.c) {
                data.breadth.total++;
                if (result.data.d > 0) data.breadth.advancers++;
                else if (result.data.d < 0) data.breadth.decliners++;
            }
            if (res.status === "rejected" || (result && result.error?.response?.status === 429)) {
                data.rateLimited = true;
            }
        });

        // 3. Calculate Momentum
        if (data.nifty) {
            const niftyChange = data.nifty.dp;
            if (Math.abs(niftyChange) < 0.3) data.momentum = "Low Momentum";
            else if (Math.abs(niftyChange) <= 1.0) data.momentum = "Moderate Momentum";
            else data.momentum = "High Momentum";
        }

        // 4. Calculate Watchlist Alpha
        if (watchlistSymbols.length > 0 && data.nifty) {
            const watchlistResults = await fetchQuotesWithRateLimit(watchlistSymbols);
            let totalPctChange = 0;
            let count = 0;

            watchlistResults.forEach(res => {
                const result = res.value;
                if (result && result.status === "success" && result.data.dp !== undefined) {
                    totalPctChange += result.data.dp;
                    count++;
                }
            });

            if (count > 0) {
                const avgChange = totalPctChange / count;
                const alpha = avgChange - data.nifty.dp;
                data.watchlistAlpha = {
                    avgChange,
                    alpha,
                    label: alpha >= 0 ? "Outperforming Market" : "Underperforming Market"
                };
            }
        }

        // 5. Generate Session Overview Text
        data.overview = generateOverviewText(data);

        return data;
    } catch (error) {
        console.error("Critical error in marketDataService:", error);
        return { error: "Failed to fetch market data", rateLimited: false };
    }
};

const generateOverviewText = (data) => {
    if (!data.nifty || !data.vix) return "Market data currently unavailable.";

    const momentum = data.momentum.toLowerCase();
    const breadthStatus = data.breadth.advancers > data.breadth.decliners ? "positive breadth" : "mixed participation";
    const vixValue = data.vix.c;
    let vixStatus = "controlled volatility";
    if (vixValue < 15) vixStatus = "calm environment";
    else if (vixValue > 25) vixStatus = "high risk profile";

    return `Markets show ${momentum} with ${breadthStatus} and ${vixStatus}.`;
};

export const getVixClassification = (value) => {
    if (value < 15) return { label: "Calm", class: "text-success" };
    if (value <= 25) return { label: "Normal", class: "text-warning" };
    return { label: "High Risk", class: "text-danger" };
};

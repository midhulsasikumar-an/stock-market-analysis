const axios = require("axios");
const PriceCache = require("../models/PriceCache");

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const CACHE_TTL_MS = 5 * 60 * 1000;
const API_DELAY_MS = 200;

const defaultFinnhubClient = axios.create({
    baseURL: "https://finnhub.io/api/v1",
    timeout: 10000
});

function normalizeSymbol(symbol) {
    return String(symbol || "").trim().toUpperCase();
}

function isFresh(entry) {
    if (!entry?.lastUpdated) return false;
    return Date.now() - new Date(entry.lastUpdated).getTime() < CACHE_TTL_MS;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromFinnhub(symbol, client = defaultFinnhubClient) {
    if (!FINNHUB_KEY) {
        throw new Error("FINNHUB_API_KEY is not configured");
    }

    const response = await client.get("/quote", {
        params: { symbol, token: FINNHUB_KEY }
    });
    console.log(`[PriceCache] Finnhub response for ${symbol}:`, response.data);

    const { data } = response;

    const currentPrice = Number(data?.c);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        throw new Error(`Finnhub returned invalid price for ${symbol}`);
    }

    const now = new Date();
    await PriceCache.findOneAndUpdate(
        { symbol },
        {
            $set: {
                symbol,
                currentPrice,
                lastUpdated: now
            }
        },
        { upsert: true, new: true }
    );
    console.log(`[PriceCache] Saved to cache: ${symbol} = ${currentPrice}`);

    return currentPrice;
}

async function getCachedPrice(symbol, client = defaultFinnhubClient) {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) throw new Error("Symbol is required");
    console.log(`[PriceCache] Checking cache for ${normalized}`);

    const cached = await PriceCache.findOne({ symbol: normalized }).lean();
    console.log(`[PriceCache] Cache result for ${normalized}:`, cached);
    if (cached && isFresh(cached)) {
        return cached.currentPrice;
    }

    console.log(`[PriceCache] Cache miss - calling Finnhub for ${normalized}`);

    return fetchFromFinnhub(normalized, client);
}

async function getCachedPrices(symbolsArray, client = defaultFinnhubClient) {
    const symbols = [...new Set((Array.isArray(symbolsArray) ? symbolsArray : []).map(normalizeSymbol).filter(Boolean))];
    const prices = {};
    let previousCallHitFinnhub = false;

    for (const symbol of symbols) {
        try {
            const before = await PriceCache.findOne({ symbol }).lean();
            const willHitFinnhub = !(before && isFresh(before));

            if (willHitFinnhub && previousCallHitFinnhub) {
                await sleep(API_DELAY_MS);
            }

            prices[symbol] = await getCachedPrice(symbol, client);
            if (willHitFinnhub) {
                previousCallHitFinnhub = true;
            }
        } catch (error) {
            console.error(`[priceCache] Failed for ${symbol}:`, error.message);
        }
    }

    return prices;
}

module.exports = {
    getCachedPrice,
    getCachedPrices
};

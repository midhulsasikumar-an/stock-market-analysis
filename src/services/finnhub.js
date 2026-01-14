import axios from "axios";

const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

if (!API_KEY) {
    console.warn("Finnhub API Key is missing! Check your .env file.");
}

const finnhub = axios.create({
    baseURL: "https://finnhub.io/api/v1",
    params: {
        token: API_KEY,
    },
});


export const fetchQuote = async (symbol) => {
    try {
        const response = await finnhub.get("/quote", {
            params: { symbol: symbol }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching quote for", symbol, error);
        return null;
    }
};

export const fetchCandles = async (symbol, resolution = "D", days = 7) => {
    try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - (days * 24 * 60 * 60);
        const response = await finnhub.get("/stock/candle", {
            params: {
                symbol: symbol,
                resolution: resolution,
                from: start,
                to: end,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching candles for", symbol, error);
        return null;
    }
};

export const fetchCompanyProfile = async (symbol) => {
    try {
        const response = await finnhub.get("/stock/profile2", {
            params: { symbol: symbol }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching profile for", symbol, error);
        return null;
    }
};

/**
 * Fetch general market news
 * @param {string} category - Category of news: general, forex, crypto, merger
 * @returns {Promise<Array>} Array of news articles
 */
export const fetchMarketNews = async (category = "general") => {
    try {
        const response = await finnhub.get("/news", {
            params: { category: category }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching market news:", error);
        return [];
    }
};

export default finnhub;

/**
 * Transaction Service
 * Handles all portfolio buy/sell operations and transaction fetching.
 * TradeTrack — Stock Market Analysis System
 */
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const transactionService = {

    /**
     * Get or create the user's default portfolio, returns portfolio _id
     */
    getOrCreatePortfolioId: async () => {
        let res = await fetch(`${API_URL}/api/portfolio`, {
            headers: authService.getAuthHeaders()
        });
        let data = await res.json();
        let pid = data?.data?.[0]?._id;

        if (!pid) {
            const createRes = await fetch(`${API_URL}/api/portfolio`, {
                method: 'POST',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify({ name: 'My Portfolio', isDefault: true })
            });
            const created = await createRes.json();
            if (!created.success) throw new Error('Failed to create portfolio');
            pid = created.data._id;
        }
        return pid;
    },

    /**
     * Buy a stock — adds to portfolio and logs a BUY transaction
     * @param {string} symbol
     * @param {string} name
     * @param {number} quantity
     * @param {number} buyPrice  (price per unit)
     * @param {string} sector
     * @returns {Promise<{success: boolean, data: object}>}
     */
    buy: async (symbol, name, quantity, buyPrice, sector = 'Other') => {
        if (!authService.isAuthenticated()) throw new Error('Not authenticated');
        const pid = await transactionService.getOrCreatePortfolioId();

        const res = await fetch(`${API_URL}/api/portfolio/${pid}/holding`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify({
                symbol: symbol.toUpperCase(),
                name: name || symbol.toUpperCase(),
                quantity: Number(quantity),
                avgBuyPrice: Number(buyPrice),
                sector
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to buy stock');
        return data;
    },

    /**
     * Sell a stock — reduces holding quantity and logs a SELL transaction
     * @param {string} symbol
     * @param {number} quantity
     * @param {number} sellPrice  (price per unit)
     * @returns {Promise<{success: boolean, data: object}>}
     */
    sell: async (symbol, quantity, sellPrice) => {
        if (!authService.isAuthenticated()) throw new Error('Not authenticated');
        const pid = await transactionService.getOrCreatePortfolioId();

        const res = await fetch(`${API_URL}/api/portfolio/${pid}/sell`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify({
                symbol: symbol.toUpperCase(),
                quantity: Number(quantity),
                pricePerUnit: Number(sellPrice)
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to sell stock');
        return data;
    },

    /**
     * Get all transactions for the current user
     * @param {object} filters — { symbol, type, limit, skip }
     * @returns {Promise<Array>}
     */
    getTransactions: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.symbol) params.append('symbol', filters.symbol);
        if (filters.type) params.append('type', filters.type);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.skip) params.append('skip', filters.skip);

        const res = await fetch(`${API_URL}/api/transactions?${params.toString()}`, {
            headers: authService.getAuthHeaders()
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch transactions');
        return data.data || [];
    },

    /**
     * Get holdings (portfolio summary) for sell modal pre-population
     * Returns a map of { [symbol]: { quantity, avgBuyPrice } }
     */
    getHoldingsMap: async () => {
        const res = await fetch(`${API_URL}/api/portfolio/summary`, {
            headers: authService.getAuthHeaders()
        });
        const data = await res.json();
        if (!data.success) return {};

        const map = {};
        (data.data?.holdings || []).forEach(h => {
            map[h.symbol.toUpperCase()] = {
                quantity: h.quantity,
                avgBuyPrice: h.avgBuyPrice,
                currentPrice: h.currentPrice
            };
        });
        return map;
    },

    /**
     * Check if a symbol is currently in the portfolio (quantity > 0)
     * @param {string} symbol
     * @returns {Promise<{inPortfolio: boolean, quantity: number, avgBuyPrice: number}>}
     */
    getHolding: async (symbol) => {
        try {
            const map = await transactionService.getHoldingsMap();
            const holding = map[symbol.toUpperCase()];
            return holding
                ? { inPortfolio: true, ...holding }
                : { inPortfolio: false, quantity: 0, avgBuyPrice: 0, currentPrice: 0 };
        } catch {
            return { inPortfolio: false, quantity: 0, avgBuyPrice: 0, currentPrice: 0 };
        }
    }
};

export default transactionService;

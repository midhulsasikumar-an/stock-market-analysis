import authService from "./authService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const watchlistService = {
    /**
     * Get user's personal watchlist from DB
     */
    getWatchlist: async () => {
        const response = await fetch(`${API_URL}/api/watchlist`, {
            method: "GET",
            headers: authService.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch watchlist");

        return data.data; // Array of items
    },

    /**
     * Add symbol to DB watchlist
     */
    addToWatchlist: async (symbol, name = "", type = "stock") => {
        const response = await fetch(`${API_URL}/api/watchlist`, {
            method: "POST",
            headers: authService.getAuthHeaders(),
            body: JSON.stringify({ symbol, name, type })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to add to watchlist");

        return data.data;
    },

    /**
     * Remove symbol from DB watchlist
     */
    removeFromWatchlist: async (symbol) => {
        const response = await fetch(`${API_URL}/api/watchlist/${symbol}`, {
            method: "DELETE",
            headers: authService.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to remove from watchlist");

        return data;
    }
};

export default watchlistService;

import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, value);
        }
    });
    const text = query.toString();
    return text ? `?${text}` : '';
}

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}/api/admin${path}`, {
        ...options,
        headers: {
            ...authService.getAuthHeaders(),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));

    if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Admin request failed');
    }

    return data;
}

const adminService = {
    getUsers: (params = {}) => request(`/users${buildQuery(params)}`),
    updateUserStatus: (userId, accountStatus) => request(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ accountStatus })
    }),
    deleteUser: (userId) => request(`/users/${userId}`, { method: 'DELETE' }),
    getStocks: (params = {}) => request(`/stocks${buildQuery(params)}`),
    updateStockVisibility: (symbol, payload) => request(`/stocks/${symbol}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    }),
    getTransactions: (params = {}) => request(`/transactions${buildQuery(params)}`),
    getPortfolioInspector: (userId) => request(`/portfolio-inspector/${userId}`),
    getAnalytics: (params = {}) => request(`/analytics${buildQuery(params)}`),
    getActivityTimeline: (days = 30) => request(`/analytics/activity${buildQuery({ days })}`),
    getWatchlistVsPortfolio: () => request('/analytics/watchlist-vs-portfolio'),
    getLatencyHistory: (days = 7) => request(`/health/latency-history${buildQuery({ days })}`),
    getActivityLogs: (params = {}) => request(`/activity-log${buildQuery(params)}`),
    getAnnouncements: () => request('/announcements'),
    createAnnouncement: (payload) => request('/announcements', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),
    expireAnnouncement: (id) => request(`/announcements/${id}/expire`, {
        method: 'PATCH'
    }),
    getSystemHealth: () => request('/system-health'),
    getPlatformSettings: () => request('/platform-settings'),
    updatePlatformSettings: (payload) => request('/platform-settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
    })
};

export default adminService;
/**
 * Authentication Service
 * Handles all authentication-related API calls
 * TradeTrack - Stock Market Analysis System
 */

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const authService = {
    /**
     * Register a new user with email and password
     */
    register: async (email, password) => {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, registrationSource: "email" })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        if (data.token) {
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        return data;
    },

    /**
     * Login user with email and password
     */
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        if (data.token) {
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        return data;
    },

    /**
     * Authenticate with Google OAuth token
     */
    googleAuth: async (token) => {
        const response = await fetch(`${API_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Google authentication failed");
        }

        if (data.token) {
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        return data;
    },

    /**
     * Verify JWT token against the server
     */
    verifyToken: async () => {
        const token = authService.getToken();
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${API_URL}/api/auth/verify-token`, {
            method: "POST",
            headers: authService.getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) authService.logout();
            throw new Error(data.message || "Token verification failed");
        }

        return data;
    },

    /**
     * Get user profile from server
     */
    getProfile: async () => {
        const token = authService.getToken();
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: "GET",
            headers: authService.getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) authService.logout();
            throw new Error(data.message || "Failed to fetch profile");
        }

        return data.user;
    },

    /**
     * Update user profile
     */
    updateProfile: async (profileData) => {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: "PUT",
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update profile");
        }

        // Update stored user data
        localStorage.setItem("user", JSON.stringify(data.user));
        return data.user;
    },

    /**
     * Logout user — clears local session and notifies server
     */
    logout: async () => {
        try {
            const token = authService.getToken();
            if (token) {
                // Notify backend (fire-and-forget, don't block on failure)
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: authService.getAuthHeaders()
                }).catch(() => { }); // Ignore network errors on logout
            }
        } finally {
            // Always clear local storage
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            localStorage.removeItem("rememberEmail");
        }
    },

    /**
     * Check if user has a valid (non-expired) token
     */
    isAuthenticated() {
        const token = localStorage.getItem("authToken");
        if (!token) return false;
        try {
            const parts = token.split(".");
            if (parts.length !== 3) return false;
            const payload = JSON.parse(atob(parts[1]));
            return payload.exp && (payload.exp * 1000) > Date.now();
        } catch {
            return false;
        }
    },

    getUser() {
        try {
            const user = localStorage.getItem("user");
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    /**
     * Get authentication token
     */
    getToken: () => {
        return localStorage.getItem("authToken");
    },

    /**
     * Get authorization headers for API calls
     */
    getAuthHeaders: () => {
        const token = authService.getToken();
        return {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
        };
    }
};

export default authService;

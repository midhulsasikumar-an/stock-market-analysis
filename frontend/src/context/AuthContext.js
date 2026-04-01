import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

/**
 * AuthProvider
 * - Validates the JWT against the server on app load.
 * - If the stored token is stale or invalid, clears it automatically.
 * - Exposes { user, isAuthenticated, isLoading, login, logout, updateUser }
 *   to all child components via useAuth().
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // true until first check done

    /**
     * Run once on mount: verify stored token is still accepted by the server.
     * Clears localStorage if the token is missing, expired, or rejected.
     */
    useEffect(() => {
        const validateSession = async () => {
            const token = authService.getToken();

            // No token at all — not logged in
            if (!token) {
                setIsLoading(false);
                return;
            }

            // Quick client-side expiry check first (saves a round-trip)
            if (!authService.isAuthenticated()) {
                authService.logout();
                setIsLoading(false);
                return;
            }

            // Server-side verification — the authoritative check
            try {
                const profile = await authService.getProfile();
                setUser(profile);
                setIsAuthenticated(true);
            } catch {
                // Token was rejected by server (revoked, tampered, wrong secret, etc.)
                authService.logout();
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        validateSession();
    }, []);

    /** Call after a successful login/register to update context state */
    const login = useCallback((userData, token) => {
        if (token) {
            localStorage.setItem("authToken", token);
        }
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
        }
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    /** Call to log out — clears server session and context */
    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    /** Call after profile update to keep context in sync */
    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    }, []);

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/** Hook to access auth state from any component */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}

export default AuthContext;

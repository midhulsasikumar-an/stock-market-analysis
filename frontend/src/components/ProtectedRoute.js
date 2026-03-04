import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — shows a loading spinner while the auth check runs,
 * then redirects to /login if the user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#0a0a0f",
                color: "#fff",
                flexDirection: "column",
                gap: "16px"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #333",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }}></div>
                <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>Verifying session...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;

/**
 * AdminRoute — ensures the user is logged in AND has role === 'admin'.
 * Non-admins are routed to regular dashboard.
 */
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: "100vh", background: "#0a0a0f", color: "#fff",
                flexDirection: "column", gap: "16px"
            }}>
                <div style={{
                    width: "40px", height: "40px", border: "3px solid #333",
                    borderTop: "3px solid #3b82f6", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }}></div>
                <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>Verifying admin access...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

    return children;
};

/**
 * PublicRoute — shows a loading spinner while checking auth,
 * then redirects authenticated users to /dashboard.
 */
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#0a0a0f"
            }}>
                <div style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid #333",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (isAuthenticated) {
        // Automatically route admin users to admin dashboard, users to user dashboard
        if (user?.role === "admin") {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

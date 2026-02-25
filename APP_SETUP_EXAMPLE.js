/**
 * App.js - TradeTrack Application Entry Point
 * Stock Market Analysis System
 * Developed by Midhul Sasikumar | Reg No: 24122018
 * 
 * This file shows how to integrate the Register, Login, and Protected routes
 * with the modern authentication system.
 */

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import authService from "./services/authService";

// Components
import Register from "./components/Register";
import Login from "./components/Login";
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute";

// Pages
import Dashboard from "./Pages/Dashboard";
// import Home from "./Pages/Home";
// import Profile from "./Pages/Profile";

// Styles
import "./App.css";

/**
 * Main App Component
 * Handles routing and authentication context
 */
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getUser();
          if (userData) {
            setUser(userData);
            
            // Optional: Verify token is still valid
            const token = authService.getToken();
            if (token) {
              // You could call a verify endpoint here
              // const response = await authService.verifyToken();
            }
          } else {
            // Token exists but user data doesn't, clear auth
            authService.logout();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f35 50%, #0d1f2d 100%)"
      }}>
        <div style={{
          textAlign: "center",
          color: "#e9ecef"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid rgba(13, 202, 240, 0.3)",
            borderTop: "4px solid #0dcaf0",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <p>Loading TradeTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ========================================
            PUBLIC ROUTES - Not authenticated
            ======================================== */}

        {/* Register Page */}
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Login Page */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        {/* Home/Landing Page */}
        {/* <Route path="/" element={<Home />} /> */}

        {/* ========================================
            PROTECTED ROUTES - Requires authentication
            ======================================== */}

        {/* Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* User Profile */}
        {/* <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        /> */}

        {/* ========================================
            CATCH-ALL ROUTES
            ======================================== */}

        {/* Redirect root to login if not authenticated */}
        <Route 
          path="/" 
          element={
            authService.isAuthenticated() ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } 
        />

        {/* 404 Not Found */}
        <Route 
          path="*" 
          element={
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
              background: "linear-gradient(135deg, #0f1419 0%, #1a1f35 50%, #0d1f2d 100%)",
              color: "#e9ecef",
              flexDirection: "column",
              gap: "20px"
            }}>
              <h1>404 - Page Not Found</h1>
              <p>Sorry, the page you're looking for doesn't exist.</p>
              <a 
                href={authService.isAuthenticated() ? "/dashboard" : "/login"}
                style={{
                  color: "#0dcaf0",
                  textDecoration: "none",
                  fontWeight: "bold"
                }}
              >
                Go to {authService.isAuthenticated() ? "Dashboard" : "Login"}
              </a>
            </div>
          } 
        />
      </Routes>

      {/* Optional: Global styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Router>
  );
}

export default App;

/**
 * ========================================
 * INTEGRATION NOTES
 * ========================================
 * 
 * 1. ENVIRONMENT VARIABLES
 *    Make sure .env file has:
 *    - REACT_APP_API_URL=http://localhost:5000
 *    - REACT_APP_GOOGLE_CLIENT_ID=your-client-id
 * 
 * 2. PROTECTED ROUTES
 *    Automatically redirect to login if not authenticated
 *    Redirect to dashboard if already authenticated
 * 
 * 3. AUTH SERVICE
 *    All authentication logic is in authService.js
 *    Handles token storage and API calls
 * 
 * 4. USER STATE
 *    Initialize user state on app load
 *    Update on login/register
 *    Clear on logout
 * 
 * 5. TOKEN MANAGEMENT
 *    JWT tokens stored in localStorage
 *    Automatically included in API requests
 *    Expires after 7 days (configurable)
 * 
 * 6. GOOGLE OAUTH
 *    Configured in Register.js and Login.js
 *    Uses Google Sign-In library from CDN
 *    Returns ID token to backend for verification
 * 
 * 7. ERROR HANDLING
 *    Validate token on app load
 *    Clear auth if token invalid
 *    Show loading screen during initialization
 * 
 * ========================================
 * USAGE EXAMPLES
 * ========================================
 * 
 * // Check if user is authenticated
 * if (authService.isAuthenticated()) {
 *   const user = authService.getUser();
 *   console.log('User:', user);
 * }
 * 
 * // Register
 * await authService.register('email@example.com', 'Password123!');
 * 
 * // Login
 * await authService.login('email@example.com', 'Password123!');
 * 
 * // Get profile
 * const profile = await authService.getProfile();
 * 
 * // Logout
 * authService.logout();
 * 
 * ========================================
 */

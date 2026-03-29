import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    // Check if already logged in
    useEffect(() => {
        if (authService.isAuthenticated()) {
            navigate("/dashboard", { replace: true });
            return;
        }
        // Always start with blank credentials when landing on login.
        setFormData({ email: "", password: "" });
        setRememberMe(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            // FIXED: was 6, now 8 to match backend and Register.js
            newErrors.password = "Password must be at least 8 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
        setGlobalError("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setGlobalError("");

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const response = await authService.login(formData.email, formData.password);

            if (response.success) {
                // Do not persist login credentials when switching accounts.
                localStorage.removeItem("rememberEmail");

                // Update global auth context so all components reflect new state
                auth.login(response.user);
                setFormData({ email: "", password: "" });
                navigate("/dashboard", { replace: true });
            }
        } catch (error) {
            setGlobalError(error.message || "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="gradient-bg"></div>

            <div className="login-card">
                <Link to="/" className="auth-close-btn" aria-label="Close login">
                    ×
                </Link>

                {/* Logo Section */}
                <div className="logo-section">
                    <img 
                        src="/tt-logo.png" 
                        alt="TradeTrack" 
                        style={{height:'48px', width:'auto', objectFit:'contain', marginBottom:'8px', filter:'brightness(0) invert(1)'}}
                    />
                </div>

                {/* Header Section */}
                <div className="header-section">
                    <h2 className="page-title">Welcome Back</h2>
                    <p className="page-subtitle">Track your investments and monitor the markets</p>
                </div>

                {/* Alert Messages */}
                {globalError && (
                    <div className="alert-box alert-error" role="alert">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{globalError}</span>
                    </div>
                )}

                {/* Form Section */}
                <form onSubmit={handleLogin} className="login-form" noValidate autoComplete="off">
                    {/* Email Field */}
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            <i className="fas fa-envelope"></i> Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-input ${errors.email ? "error" : ""} ${formData.email ? "filled" : ""}`}
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="off"
                        />
                        {errors.email && (
                            <p className="error-message">
                                <i className="fas fa-times-circle"></i> {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <div className="password-header">
                            <label htmlFor="password" className="form-label">
                                <i className="fas fa-lock"></i> Password
                            </label>
                            {/* FIXED: Use <Link> instead of <a> for SPA navigation */}
                            <Link to="/forgot-password" className="forgot-password">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                className={`form-input ${errors.password ? "error" : ""} ${formData.password ? "filled" : ""}`}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(prev => !prev)}
                                disabled={isLoading}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fas fa-eye${showPassword ? "" : "-slash"}`}></i>
                            </button>
                        </div>
                        {errors.password && (
                            <p className="error-message">
                                <i className="fas fa-times-circle"></i> {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Remember Me */}
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                            />
                            <span>Remember my email</span>
                        </label>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><span className="spinner"></span> Signing In...</>
                        ) : (
                            <><i className="fas fa-sign-in-alt"></i> Sign In</>
                        )}
                    </button>
                </form>

                {/* Footer Section */}
                <div className="footer-section">
                    <p className="signup-link">
                        Don't have an account?
                        {/* FIXED: Use <Link> instead of <a> for SPA navigation */}
                        <Link to="/register" className="link-primary"> Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

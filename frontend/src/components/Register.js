import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

export default function Register() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [globalError, setGlobalError] = useState("");

    useEffect(() => {
        document.title = 'Create Account — TradeTrack';
    }, []);

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

        if (!formData.username) {
            newErrors.username = "Username is required";
        } else if (!usernameRegex.test(formData.username)) {
            newErrors.username = "Username must be 3-20 characters and use only letters, numbers, or underscore";
        }

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = "Password must contain at least one uppercase letter";
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = "Password must contain at least one number";
        } else if (!/[!@#$%^&*]/.test(formData.password)) {
            newErrors.password = "Password must contain at least one special character (!@#$%^&*)";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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

    // FIXED: Now uses authService.register() instead of a raw fetch call
    const handleRegister = async (e) => {
        e.preventDefault();
        setGlobalError("");
        setSuccessMessage("");

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await authService.register(formData.username, formData.email, formData.password);

            setSuccessMessage("Account created successfully! Redirecting to login...");
            setFormData({ username: "", email: "", password: "", confirmPassword: "" });

            setTimeout(() => navigate("/login", { replace: true }), 1500);
        } catch (error) {
            setGlobalError(error.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="gradient-bg"></div>

            <div className="register-card">
                <Link to="/" className="auth-close-btn" aria-label="Close registration">
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
                    <h2 className="page-title">Create Your Account</h2>
                    <p className="page-subtitle">Track stocks, monitor portfolios, and get AI-powered insights</p>
                </div>

                {/* Alert Messages */}
                {globalError && (
                    <div className="alert-box alert-error" role="alert">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{globalError}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="alert-box alert-success" role="status">
                        <i className="fas fa-check-circle"></i>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Form Section */}
                <form onSubmit={handleRegister} className="register-form" noValidate>
                    {/* Username Field */}
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">
                            <i className="fas fa-user"></i> Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className={`form-input ${errors.username ? "error" : ""} ${formData.username ? "filled" : ""}`}
                            placeholder="trader_123"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="username"
                        />
                        {errors.username && (
                            <p className="error-message">
                                <i className="fas fa-times-circle"></i> {errors.username}
                            </p>
                        )}
                    </div>

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
                            autoComplete="email"
                        />
                        {errors.email && (
                            <p className="error-message">
                                <i className="fas fa-times-circle"></i> {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            <i className="fas fa-lock"></i> Password
                        </label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                className={`form-input ${errors.password ? "error" : ""} ${formData.password ? "filled" : ""}`}
                                placeholder="Min 8 chars with uppercase, number & symbol"
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
                        {formData.password && !errors.password && (
                            <p className="success-message">
                                <i className="fas fa-check-circle"></i> Password meets requirements
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            <i className="fas fa-check-circle"></i> Confirm Password
                        </label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                className={`form-input ${errors.confirmPassword ? "error" : ""} ${formData.confirmPassword ? "filled" : ""}`}
                                placeholder="Re-enter your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                disabled={isLoading}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fas fa-eye${showConfirmPassword ? "" : "-slash"}`}></i>
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="error-message">
                                <i className="fas fa-times-circle"></i> {errors.confirmPassword}
                            </p>
                        )}
                        {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                            <p className="success-message">
                                <i className="fas fa-check-circle"></i> Passwords match
                            </p>
                        )}
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><span className="spinner"></span> Creating Account...</>
                        ) : (
                            <><i className="fas fa-user-plus"></i> Create Account</>
                        )}
                    </button>
                </form>

                {/* Footer Section */}
                <div className="footer-section">
                    <p className="signin-link">
                        Already have an account?
                        {/* FIXED: Use <Link> instead of <a> for SPA navigation */}
                        <Link to="/login" className="link-primary"> Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

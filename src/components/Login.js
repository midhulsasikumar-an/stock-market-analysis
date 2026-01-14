import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { users } from "../data/UserData";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Clean up modals on unmount
    useEffect(() => {
        return () => {
            // Redundant safeguard on unmount
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
            document.body.style.removeProperty('overflow');
        };
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");

        // 1. Get existing users from localStorage
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");

        // 2. Validate against stored users
        const user = storedUsers.find(
            (u) => u.username === email && u.password === password
        );

        if (!user) {
            setError("Invalid email or password");
            return;
        }

        // 3. Persist login session
        localStorage.setItem("currentUser", JSON.stringify(user));

        // 4. Robust Modal Cleanup
        const modalEle = document.getElementById('loginModal');
        if (window.bootstrap && modalEle) {
            const modal = window.bootstrap.Modal.getInstance(modalEle);
            if (modal) {
                modal.hide();
                // modal.dispose(); // CRITICAL: Removed to prevent TypeError
            } else {
                new window.bootstrap.Modal(modalEle).hide();
            }
        }

        // CRITICAL: Force remove backdrop and reset body styles
        // Wait briefly for hide animation to start, then kill it
        setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());

            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
            document.body.style.removeProperty('overflow');
            document.body.style.overflow = "auto"; // Force scroll restoration

            // Redirect immediately after cleanup
            navigate("/dashboard");
        }, 100);
    };

    return (
        <div className="modal fade" id="loginModal" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div
                    className="modal-content text-white"
                    style={{
                        background: "rgba(20, 20, 30, 0.95)",
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                    }}
                >
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">Welcome Back!</h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            data-bs-dismiss="modal"
                        ></button>
                    </div>

                    <div className="modal-body p-4">
                        <p className="text-muted mb-4 small">
                            Sign in to access your portfolio and market analysis.
                        </p>

                        {error && (
                            <div className="alert alert-danger py-2 small" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label className="form-label small text-uppercase text-muted fw-bold">Email address</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-secondary text-secondary">
                                        <i className="fas fa-envelope"></i>
                                    </span>
                                    <input
                                        type="email"
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small text-uppercase text-muted fw-bold">Password</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-secondary text-secondary">
                                        <i className="fas fa-lock"></i>
                                    </span>
                                    <input
                                        type="password"
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                    <span className="input-group-text bg-dark text-white border-secondary" style={{ cursor: 'pointer' }}>
                                        <i className="fas fa-eye"></i>
                                    </span>
                                </div>
                            </div>

                            <div className="form-check mb-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <input
                                        type="checkbox"
                                        className="form-check-input bg-dark border-secondary"
                                        id="remember"
                                    />
                                    <label className="form-check-label text-muted small" htmlFor="remember">
                                        Remember me
                                    </label>
                                </div>
                                <a href="#" className="text-decoration-none text-primary small">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2 fw-bold mb-3"
                                style={{
                                    background: "linear-gradient(45deg, #0d6efd, #0dcaf0)",
                                    border: "none",
                                    boxShadow: "0 4px 15px rgba(13, 202, 240, 0.3)"
                                }}
                            >
                                Sign In
                            </button>

                            <div className="divider d-flex align-items-center my-3">
                                <hr className="flex-grow-1 border-secondary" />
                                <span className="mx-2 text-muted small">or continue with</span>
                                <hr className="flex-grow-1 border-secondary" />
                            </div>

                            <div className="social-login d-flex gap-2 mb-3">
                                <button type="button" className="btn btn-outline-secondary w-50 text-white border-secondary">
                                    <i className="fab fa-google me-2"></i>Google
                                </button>
                                <button type="button" className="btn btn-outline-secondary w-50 text-white border-secondary">
                                    <i className="fab fa-facebook-f me-2"></i>Facebook
                                </button>
                            </div>

                            <div className="register-link text-center mt-4">
                                <span className="text-muted small">Don't have an account? </span>
                                <a
                                    className="text-decoration-none text-primary fw-bold small"
                                    role="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#registerModal"
                                    style={{ cursor: 'pointer' }}
                                >
                                    Register now
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

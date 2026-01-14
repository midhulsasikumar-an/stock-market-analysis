import React, { useState } from "react";
// Remove local data import, use localStorage instead
// import { users } from "../data/UserData"; 

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleRegister = (e) => {
        e.preventDefault();
        setError("");

        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // 1. Get existing users from localStorage
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");

        // 2. Check if user already exists
        const userExists = storedUsers.find((u) => u.username === email);
        if (userExists) {
            setError("User already registered");
            return;
        }

        // 3. Save new user to localStorage
        const newUser = { username: email, password: password };
        const updatedUsers = [...storedUsers, newUser];
        localStorage.setItem("users", JSON.stringify(updatedUsers));

        // Clear form
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // 4. Robust Modal Cleanup
        const modalEle = document.getElementById('registerModal');
        if (window.bootstrap && modalEle) {
            const modal = window.bootstrap.Modal.getInstance(modalEle);
            if (modal) {
                modal.hide();
                // modal.dispose(); // CRITICAL: Removed to prevent TypeError
            } else {
                new window.bootstrap.Modal(modalEle).hide();
            }
        }

        // CRITICAL: Force remove backdrop and reset body styles immediately
        // This handles cases where Bootstrap animation fails or lags
        setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());

            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
            document.body.style.removeProperty('overflow');
            document.body.style.overflow = "auto"; // Force scroll restoration
        }, 100);
    };

    return (
        <div
            className="modal fade"
            id="registerModal"
            tabIndex="-1"
            aria-labelledby="registerModalLabel"
            aria-hidden="true"
        >
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
                        <h5 className="modal-title fw-bold" id="registerModalLabel">
                            Create Account
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="modal-body p-4">
                        <p className="text-muted mb-4 small">
                            Join our professional trading community today.
                        </p>

                        {error && (
                            <div className="alert alert-danger py-2 small" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister}>
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
                                        placeholder="Min 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small text-uppercase text-muted fw-bold">Confirm Password</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-secondary text-secondary">
                                        <i className="fas fa-check-circle"></i>
                                    </span>
                                    <input
                                        type="password"
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2 fw-bold"
                                style={{
                                    background: "linear-gradient(45deg, #0d6efd, #0dcaf0)",
                                    border: "none",
                                    boxShadow: "0 4px 15px rgba(13, 202, 240, 0.3)"
                                }}
                            >
                                Register
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

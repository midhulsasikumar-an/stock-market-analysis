import React from 'react'
import { useNavigate, Link } from 'react-router-dom'


export default function Login() {
    const navigate = useNavigate();
    const handleLogin = () => {
        navigate("/dashboard")
    }
    return (

        <div className="modal fade" id="loginModal" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content bg-dark text-white">
                    <div className="modal-header border-secondary">
                        <h5 className="modal-title">Welcome Back!</h5>
                        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div className="modal-body">
                        <form>
                            <div className="mb-3">
                                <label className="form-label">Email address</label>
                                <div className="input-group">
                                    <input type="email" className="form-control bg-dark text-white border-secondary" placeholder="name@example.com" />
                                    <span className="input-group-text bg-dark text-white border-secondary">
                                        <i className="fas fa-envelope"></i>
                                    </span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <div className="input-group">
                                    <input type="password" className="form-control bg-dark text-white border-secondary" placeholder="Enter your password" />
                                    <span className="input-group-text bg-dark text-white border-secondary password-toggle">
                                        <i className="fas fa-eye"></i>
                                    </span>
                                </div>
                            </div>

                            <div className="form-check mb-3">
                                <div>
                                    <input type="checkbox" className="form-check-input bg-dark border-secondary" id="remember" />
                                    <label className="form-check-label" htmlFor="remember">Remember me</label>
                                </div>
                                <a href="#" className="text-decoration-none text-primary">Forgot password?</a>
                            </div>

                            <button type="submit" className="btn btn-primary w-100 mb-3" onClick={handleLogin}>Sign In</button>

                            <div className="divider d-flex align-items-center my-3">
                                <hr className="flex-grow-1 border-secondary" />
                                <span className="mx-2 text-muted">or continue with</span>
                                <hr className="flex-grow-1 border-secondary" />
                            </div>

                            <div className="social-login d-flex gap-2 mb-3">
                                <button type="button" className="btn btn-outline-light w-50">
                                    <i className="fab fa-google me-2"></i>Google
                                </button>
                                <button type="button" className="btn btn-outline-light w-50">
                                    <i className="fab fa-facebook-f me-2"></i>Facebook
                                </button>
                            </div>

                            <div className="register-link text-center">
                                Don't have an account? <a className="text-decoration-none text-primary" data-bs-toggle="modal" data-bs-target="#registerModal">Register now</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

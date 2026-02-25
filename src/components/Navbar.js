import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar component for the Home/Public pages.
 * Shows "Login" when logged out, "Go to Dashboard" when logged in.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top bg-transparent public-navbar">
        <div className="container-fluid">
          {/* Logo / Brand */}
          <Link className="navbar-brand ms-3 fw-bold" to="/">TradeTrack</Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about-us">Why TradeTrack</a>
              </li>
            </ul>

            {/* Auth-aware CTA button */}
            <div className="d-flex align-items-center">
              {!isLoading && (
                isAuthenticated ? (
                  <button
                    type="button"
                    className="btn btn-primary mx-2 px-4 home-login-btn"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary mx-2 px-4 home-login-btn"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Navbar component for the Home/Public pages.
 * Focuses on marketing content and user onboarding.
 */
export default function Navbar() {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top bg-transparent">
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
              {/* Navigation Links */}
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>

              <li className="nav-item">
                {/* Renamed from "About Us" to focus on value prop */}
                <a className="nav-link" href="#about-us">Why TradeTrack</a>
              </li>
            </ul>

            {/* Call to Action */}
            <div className="d-flex align-items-center">
              <button
                type="button"
                className="btn btn-primary mx-2 px-4"
                data-bs-toggle="modal"
                data-bs-target="#loginModal"
                style={{ borderRadius: '8px', fontWeight: '600' }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}

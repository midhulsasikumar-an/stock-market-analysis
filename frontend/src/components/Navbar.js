import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Premium Public Navbar — TradeTrack
 * Transparent + glassmorphism blur, smooth scroll nav links,
 * hover underline animations, and auth-aware CTA button.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const smoothScrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`tt-navbar navbar navbar-expand-lg${scrolled ? ' scrolled' : ''}`}>
      <div className="container-fluid">

        {/* ── Brand ── */}
        <Link className="tt-nav-brand" to="/">
          <img
            src="/tt-logo.png"
            alt="TradeTrack"
            style={{ height: '32px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <span>TradeTrack</span>
        </Link>

        {/* ── Mobile toggler ── */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#ttNavbar"
          aria-controls="ttNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* ── Nav Links + CTA ── */}
        <div className="collapse navbar-collapse" id="ttNavbar">
          <ul className="tt-nav-links ms-auto me-3">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <a href="#why-tradetrack" onClick={(e) => smoothScrollTo(e, 'why-tradetrack')}>
                Features
              </a>
            </li>
            <li>
              <a href="#market-snapshot" onClick={(e) => smoothScrollTo(e, 'market-snapshot')}>
                Market Snapshot
              </a>
            </li>
            <li>
              <a href="#about-section" onClick={(e) => smoothScrollTo(e, 'about-section')}>
                About
              </a>
            </li>
            <li>
              <a href="#footer" onClick={(e) => smoothScrollTo(e, 'footer')}>
                Contact
              </a>
            </li>
          </ul>

          {/* ── Auth-aware CTA ── */}
          {!isLoading && (
            isAuthenticated ? (
              <button
                id="navbar-dashboard-btn"
                className="tt-nav-cta"
                onClick={() => navigate('/dashboard')}
              >
                <i className="bi bi-grid-1x2-fill" />
                View Dashboard
              </button>
            ) : (
              <button
                id="navbar-login-btn"
                className="tt-nav-cta"
                onClick={() => navigate('/dashboard')}
              >
                <i className="bi bi-bar-chart-line-fill" />
                View Dashboard
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

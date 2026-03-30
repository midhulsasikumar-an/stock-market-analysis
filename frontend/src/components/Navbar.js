import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import tradeTrackLogo from '../assets/images/Trade-Track-Logo.png';

/**
 * Premium Public Navbar — TradeTrack
 * Transparent + glassmorphism blur, smooth scroll nav links,
 * hover underline animations, and auth-aware CTA button.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const smoothScrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav
      className={`tt-navbar navbar navbar-expand-lg${scrolled ? " scrolled" : ""}`}
    >
      <div className="container-fluid tt-navbar-shell">
        {/* ── Brand ── */}
        <Link className="tt-nav-brand" to="/">
          <img
            src={tradeTrackLogo}
            alt="TradeTrack"
            style={{
              height: "32px",
              width: "auto",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
          />
          <span>TradeTrack</span>
        </Link>

        {/* ── Mobile toggler ── */}
        <button
          className={`navbar-toggler${menuOpen ? " is-open" : ""}`}
          type="button"
          aria-controls="ttNavbar"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* ── Nav Links + CTA ── */}
        <div
          className={`navbar-collapse tt-nav-panel${menuOpen ? " show" : ""}`}
          id="ttNavbar"
        >
          <ul className="tt-nav-links me-auto">
            <li>
              <a
                href="#features"
                onClick={(e) => smoothScrollTo(e, "features")}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#how-it-works"
                onClick={(e) => smoothScrollTo(e, "how-it-works")}
              >
                How It Works
              </a>
            </li>
            <li>
              <a
                href="#market-data"
                onClick={(e) => smoothScrollTo(e, "market-data")}
              >
                Market Data
              </a>
            </li>
          </ul>

          <div className="tt-nav-actions">
            <Link
              to="/login"
              className="tt-nav-secondary-btn"
              onClick={() => setMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="tt-nav-cta"
              onClick={() => setMenuOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

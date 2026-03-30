import React from "react";
import { Link } from "react-router-dom";
import tradeTrackLogo from '../assets/images/Trade-Track-Logo.png';

/**
 * Footer – 4-column premium fintech layout
 */
export default function Footer() {
  return (
    <footer className="tt-footer" id="footer">
      <div className="container">
        <div className="row g-5">
          {/* ── COLUMN 1: Brand ── */}
          <div className="col-lg-4 col-md-6">
            <div className="tt-footer-logo">
              <img
                src={tradeTrackLogo}
                alt="TradeTrack"
                style={{
                  height: "28px",
                  width: "auto",
                  objectFit: "contain",
                  marginBottom: "12px",
                  filter: "brightness(0) invert(1)",
                }}
              />
            </div>
            <p className="tt-footer-desc">
              Real-time stock tracking and advanced market intelligence.
              Empowering investors with professional-grade analytics and
              AI-powered insights.
            </p>
            <div className="tt-footer-socials">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="tt-footer-social-btn"
                aria-label="LinkedIn"
              >
                <i className="bi bi-linkedin" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="tt-footer-social-btn"
                aria-label="GitHub"
              >
                <i className="bi bi-github" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="tt-footer-social-btn" aria-label="Twitter">
                <i className="bi bi-twitter-x" />
              </a>
            </div>
          </div>

          {/* ── COLUMN 2: Navigation ── */}
          <div className="col-lg-2 col-md-6 col-sm-6">
            <h6 className="tt-footer-col-title">Navigation</h6>
            <ul className="tt-footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/stocks">Stocks Explorer</Link>
              </li>
              <li>
                <Link to="/dashboard/news">Market News</Link>
              </li>
              <li>
                <Link to="/dashboard/portfolio">Portfolio</Link>
              </li>
            </ul>
          </div>

          {/* ── COLUMN 3: Resources ── */}
          <div className="col-lg-2 col-md-6 col-sm-6">
            <h6 className="tt-footer-col-title">Resources</h6>
            <ul className="tt-footer-links">
              <li>
                <a href="/#how-it-works">Help Center</a>
              </li>
              <li>
                <a href="/#market-data">API Docs</a>
              </li>
              <li>
                <Link to="/dashboard/news">System Status</Link>
              </li>
              <li>
                <Link to="/stocks">Changelog</Link>
              </li>
              <li>
                <Link to="/register">Community</Link>
              </li>
            </ul>
          </div>

          {/* ── COLUMN 4: Legal ── */}
          <div className="col-lg-2 col-md-6 col-sm-6">
            <h6 className="tt-footer-col-title">Legal</h6>
            <ul className="tt-footer-links">
              <li>
                <a href="/#about-section">Privacy Policy</a>
              </li>
              <li>
                <a href="/#about-section">Terms of Service</a>
              </li>
              <li>
                <a href="/#about-section">Disclaimer</a>
              </li>
              <li>
                <a href="/#about-section">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="tt-footer-divider" />
        <div className="tt-footer-bottom">
          <span className="tt-footer-copy">
            © {new Date().getFullYear()} TradeTrack — All rights reserved
          </span>
          <span className="tt-footer-edu">
            <i className="bi bi-shield-check" style={{ color: "#3b82f6" }} />
            For educational & informational purposes only
          </span>
          <span className="tt-footer-copy">
            Data: <span style={{ color: "#475569" }}>Finnhub API</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

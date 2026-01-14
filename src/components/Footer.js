import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer - 4-Column Professional Fintech Design
 */
export default function Footer() {
  return (
    <footer className="footer-fintech mt-auto">
      <div className="container">
        <div className="row g-4 justify-content-between">

          {/* COLUMN 1: BRAND */}
          <div className="col-lg-3 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="brand-icon fs-4">📈</span>
              <span className="fw-bold text-white letter-spacing-wide">TRADETRACK</span>
            </div>
            <p className="footer-brand-desc">
              Real-time stock tracking and market insights.
              Empowering investors with professional-grade analytics and precise data.
            </p>
          </div>

          {/* COLUMN 2: NAVIGATION */}
          <div className="col-lg-2 col-md-6">
            <h6 className="footer-section-title">Navigation</h6>
            <ul className="footer-link-list">
              <li><Link to="/dashboard" className="footer-link">Dashboard</Link></li>
              <li><Link to="/stocks" className="footer-link">Stocks</Link></li>
              <li><Link to="/watchlist" className="footer-link">Watchlist</Link></li>
              <li><Link to="/news" className="footer-link">Market News</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: RESOURCES */}
          <div className="col-lg-2 col-md-6">
            <h6 className="footer-section-title">Resources</h6>
            <ul className="footer-link-list">
              <li><Link to="/help" className="footer-link">Help Center</Link></li>
              <li><Link to="/support" className="footer-link">Support</Link></li>
              <li><Link to="/api" className="footer-link">API Docs</Link></li>
              <li><Link to="/status" className="footer-link">System Status</Link></li>
            </ul>
          </div>

          {/* COLUMN 4: LEGAL & INFO */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-section-title">Market Intelligence</h6>
            <div className="footer-info-text">
              Data Source: <span className="text-white opacity-100">Finnhub API</span>
            </div>
            <div className="footer-info-text mb-3">
              Market data may be delayed by up to 15 minutes.
            </div>
            <ul className="footer-link-list">
              <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link to="/disclaimer" className="footer-link">Legal Disclaimer</Link></li>
              <li><Link to="/terms" className="footer-link">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom-bar">
          <div>
            © {new Date().getFullYear()} TradeTrack Dashboard — For educational purposes only
          </div>
          <div className="d-flex gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link opacity-50">
              <i className="bi bi-github fs-5"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

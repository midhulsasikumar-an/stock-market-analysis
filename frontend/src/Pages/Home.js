import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Navbar from '../components/Navbar';
import Intro from '../components/Intro';
import Footer from '../components/Footer';
import AboutUs from '../components/AboutUs';
import { useAuth } from '../context/AuthContext';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-root">
      {/* 1. Hero Section (Intro) */}
      <Intro />

      {/* 2. Why TradeTrack Section */}
      <section className="home-section">
        <div className="container">
          <h2 className="home-section-title">Why TradeTrack?</h2>
          <p className="home-section-subtitle">
            Experience the next generation of market analysis with a platform built for modern traders.
          </p>
          <div className="feature-grid">
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h4>Real-time market intelligence</h4>
              <p>Get instant updates and live data from global markets without delays.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔍</span>
              <h4>Clean analytics &amp; insights</h4>
              <p>Turn complex data into actionable insights with our intuitive visualization tools.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🚀</span>
              <h4>Built for speed and clarity</h4>
              <p>A high-performance interface designed to help you make decisions faster.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🛡️</span>
              <h4>Secure and reliable data</h4>
              <p>Your data and privacy are protected with industry-leading security standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. What TradeTrack Does Section */}
      <section className="home-section" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
        <div className="container">
          <h2 className="home-section-title">What TradeTrack Does</h2>
          <p className="home-section-subtitle">
            All the tools you need to stay on top of the market, in one unified view.
          </p>
          <div className="func-row">
            <div className="func-item">
              <span>📈</span>
              <h5>Track live stock prices and market indices effortlessly.</h5>
            </div>
            <div className="func-item">
              <span>📉</span>
              <h5>Analyze trends and momentum with professional indicators.</h5>
            </div>
            <div className="func-item">
              <span>🔭</span>
              <h5>Monitor personalized watchlists across various asset classes.</h5>
            </div>
            <div className="func-item">
              <span>📰</span>
              <h5>Stay informed with the latest market news and global events.</h5>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Market Snapshot (Static UI) */}
      <section className="home-section">
        <div className="container">
          <h2 className="home-section-title">Market Snapshot</h2>
          <p className="home-section-subtitle">
            A quick glance at the current market sentiment and major indices.
          </p>
          <div className="snapshot-grid">
            <div className="snapshot-card">
              <span className="snapshot-label">NIFTY 50</span>
              <span className="snapshot-value snapshot-trend-up">22,126.35 (+1.2%)</span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-label">SENSEX</span>
              <span className="snapshot-value snapshot-trend-up">72,854.12 (+0.9%)</span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-label">INDIA VIX</span>
              <span className="snapshot-value">14.22</span>
              <span className="vix-risk-badge">Moderate Risk</span>
            </div>
            <div className="snapshot-card">
              <span className="snapshot-label">Market Mood</span>
              <span className="snapshot-value text-primary">Bullish</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="home-section" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
        <div className="container">
          <h2 className="home-section-title">How It Works</h2>
          <p className="home-section-subtitle">
            Get started in minutes and transform the way you track your investments.
          </p>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <h5>Search a stock</h5>
              <p className="text-muted small">Enter any symbol to see deep data.</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h5>Analyze trends</h5>
              <p className="text-muted small">Use indicators to spot opportunities.</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h5>Track &amp; decide</h5>
              <p className="text-muted small">Add to watchlist and make your move.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Us (Existing) */}
      <AboutUs />

      {/* 7. Call To Action Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to take control?</h2>
          <p className="cta-subtitle">
            Join thousands of traders who use TradeTrack to stay ahead of the curve.
            Start your market analysis journey today.
          </p>
          <div className="cta-btn-wrap">
            {/* FIXED: Use React Router navigate instead of window.location.href
                Shows "Go to Dashboard" if already logged in, otherwise "Get Started" */}
            {isAuthenticated ? (
              <button
                type="button"
                className="btn btn-primary btn-lg px-5 py-3 fw-bold cta-main-btn"
                onClick={() => navigate('/dashboard')}
                style={{ borderRadius: '12px', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)' }}
              >
                Go to Dashboard →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-lg px-5 py-3 fw-bold cta-main-btn"
                onClick={() => navigate('/register')}
                style={{ borderRadius: '12px', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)' }}
              >
                Get Started for Free
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Layout Components */}
      <Navbar />
      <Footer />
    </div>
  );
}

export default Home;

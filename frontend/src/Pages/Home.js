import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

/* ──────────────────────────────────────────
   SCROLL ANIMATION HOOK
   ────────────────────────────────────────── */
function useScrollFadeIn() {
  useEffect(() => {
    const targets = document.querySelectorAll(
      '.fade-in-up, .fade-in-left, .fade-in-right'
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ──────────────────────────────────────────
   ANIMATED COUNTER
   ────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ──────────────────────────────────────────
   MINI SVG SPARKLINE (decorative)
   ────────────────────────────────────────── */
function Sparkline({ color = '#10b981', points }) {
  const defaultPoints = points || [
    [0, 40], [10, 35], [20, 42], [30, 28], [40, 33],
    [50, 20], [60, 25], [70, 15], [80, 22], [90, 10], [100, 18],
  ];
  const w = 100, h = 50;
  const xs = defaultPoints.map(([x]) => x);
  const ys = defaultPoints.map(([, y]) => y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const toSvg = ([x, y]) => [
    (x / Math.max(...xs)) * w,
    h - ((y - minY) / (maxY - minY || 1)) * h * 0.8 - h * 0.1,
  ];
  const svgPoints = defaultPoints.map(toSvg);
  const linePath = svgPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${svgPoints[svgPoints.length - 1][0]},${h} L${svgPoints[0][0]},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={linePath} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────────────────────────────────────
   MAIN HOME COMPONENT
   ────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  useScrollFadeIn();

  const goToDashboard = () => navigate('/dashboard');
  const goToRegister = () => navigate('/register');

  const smoothScroll = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-root">
      <Navbar />

      {/* ════════════════════════════════════════
          1. HERO SECTION
          ════════════════════════════════════════ */}
      <section className="tt-hero" id="hero">
        <div className="container">
          <div className="tt-hero-grid">

            {/* Left: Text */}
            <div>
              <div className="tt-hero-badge fade-in-up">
                <span className="badge-dot" />
                Live Market Data · MERN Stack
              </div>

              <h1 className="tt-hero-headline fade-in-up delay-1">
                Think ahead.<br />
                <span className="gradient-text">Invest ahead.</span>
              </h1>

              <p className="tt-hero-sub fade-in-up delay-2">
                Analyze live market data, identify trends using advanced indicators, and make
                smarter investment decisions with confidence.
              </p>

              <div className="tt-hero-cta fade-in-up delay-3">
                <button
                  id="hero-view-dashboard-btn"
                  className="tt-btn-primary"
                  onClick={goToDashboard}
                >
                  <i className="bi bi-bar-chart-line-fill" />
                  View Live Dashboard
                </button>
                <a
                  id="hero-explore-features-btn"
                  href="#why-tradetrack"
                  className="tt-btn-secondary"
                  onClick={(e) => smoothScroll(e, 'why-tradetrack')}
                >
                  <i className="bi bi-compass" />
                  Explore Features
                </a>
              </div>

              <div className="tt-hero-trust fade-in-up delay-4">
                <i className="bi bi-lightning-charge-fill trust-dot" />
                Real-time market data powered by Finnhub API
                <span style={{ opacity: 0.3 }}>|</span>
                Built using MERN Stack Architecture
              </div>
            </div>

            {/* Right: Floating Glass Card */}
            <div className="tt-hero-right fade-in-right delay-2">
              <div className="tt-hero-card">
                <div className="tt-hero-card-title">
                  Market Overview
                  <span className="live-label">
                    <span className="live-dot" /> LIVE
                  </span>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">NIFTY 50</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tt-index-val">22,126</div>
                    <div className="tt-index-change up">
                      <i className="bi bi-caret-up-fill" />+1.24%
                    </div>
                  </div>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">SENSEX</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tt-index-val">72,854</div>
                    <div className="tt-index-change up">
                      <i className="bi bi-caret-up-fill" />+0.91%
                    </div>
                  </div>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">INDIA VIX</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tt-index-val">14.22</div>
                    <span className="tt-vix-badge">Moderate Risk</span>
                  </div>
                </div>

                <div className="tt-mini-chart" style={{ marginTop: '1.25rem' }}>
                  <Sparkline color="#10b981" />
                </div>

                <div style={{
                  fontSize: '0.65rem', color: '#334155',
                  marginTop: '0.6rem', textAlign: 'right',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem'
                }}>
                  <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 3s linear infinite' }} />
                  Updated just now
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. WHY TRADETRACK
          ════════════════════════════════════════ */}
      <section className="tt-section" id="why-tradetrack">
        <div className="container">
          <div className="tt-section-label fade-in-up">Why TradeTrack</div>
          <h2 className="tt-section-title fade-in-up delay-1">
            Built for Modern Traders
          </h2>
          <p className="tt-section-sub fade-in-up delay-2">
            Experience the next generation of market analysis with a platform
            engineered for speed, clarity, and confidence.
          </p>

          <div className="tt-feature-grid">
            {[
              {
                icon: '⚡',
                title: 'Real-Time Market Intelligence',
                desc: 'Get instant updates and live data from global markets powered by Finnhub API — zero delay, always current.',
                delay: '',
              },
              {
                icon: '📊',
                title: 'Clean Analytics & Visual Insights',
                desc: 'Turn complex candlestick data into actionable insights with intuitive charts and indicator overlays.',
                delay: 'delay-1',
              },
              {
                icon: '🚀',
                title: 'High-Performance Interface',
                desc: 'A blazing-fast React frontend optimized for rapid decision-making—no lag, no clutter.',
                delay: 'delay-2',
              },
              {
                icon: '🛡️',
                title: 'Secure & Reliable Data',
                desc: 'JWT-based authentication, encrypted sessions, and robust middleware protect your data at every layer.',
                delay: 'delay-3',
              },
            ].map((f, i) => (
              <div key={i} className={`tt-feature-card fade-in-up ${f.delay}`}>
                <div className="tt-feature-icon-wrap">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. DETAILED FEATURES (2-COL BLOCKS)
          ════════════════════════════════════════ */}
      <section className="tt-section tt-section-alt" id="features">
        <div className="container">
          <div className="tt-section-label fade-in-up">Feature Breakdown</div>
          <h2 className="tt-section-title fade-in-up delay-1">Everything You Need</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            Professional tools — designed for everyone from beginners to active traders.
          </p>

          <div className="tt-features-blocks">

            {/* Block 1 */}
            <div className="tt-feature-block fade-in-up">
              <div>
                <div className="tt-feature-block-icon">📈</div>
                <h3>Real-Time Stock Tracking</h3>
                <p>
                  Search any stock symbol and instantly see live price quotes, daily range,
                  volume, and key statistics. Our backend proxies Finnhub API to deliver
                  millisecond-fresh data straight to your dashboard.
                </p>
              </div>
              <div className="tt-feature-block-visual">
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>RELIANCE.NS</span>
                    <span className="tt-mock-badge">+1.8%</span>
                  </div>
                  <div className="tt-mock-chart">
                    <Sparkline color="#10b981" points={[[0, 30], [10, 25], [20, 35], [30, 22], [40, 38], [50, 28], [60, 42], [70, 32], [80, 48], [90, 38], [100, 52]]} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>L: $2,410</span>
                    <span style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 700 }}>$2,548.30</span>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>H: $2,562</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2 */}
            <div className="tt-feature-block reverse fade-in-up">
              <div>
                <div className="tt-feature-block-icon">🔬</div>
                <h3>Advanced Technical Indicators</h3>
                <p>
                  Analyze momentum, trend direction, and volatility with professional
                  indicators computed in real-time. All displayed in an interactive overlay
                  on candlestick charts.
                </p>
                <div className="tt-mock-indicator-row" style={{ marginTop: '1.25rem' }}>
                  <span className="tt-indicator-chip">RSI</span>
                  <span className="tt-indicator-chip">MACD</span>
                  <span className="tt-indicator-chip">EMA 20</span>
                  <span className="tt-indicator-chip">SMA 50</span>
                  <span className="tt-indicator-chip">Bollinger Bands</span>
                </div>
              </div>
              <div className="tt-feature-block-visual">
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>RSI (14) — Momentum</div>
                  <Sparkline color="#a78bfa" points={[[0, 55], [10, 58], [20, 62], [30, 70], [40, 68], [50, 72], [60, 65], [70, 60], [80, 55], [90, 50], [100, 45]]} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', color: '#10b981' }}>Oversold: 30</span>
                    <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700 }}>RSI: 55.4</span>
                    <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>Overbought: 70</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3 */}
            <div className="tt-feature-block fade-in-up">
              <div>
                <div className="tt-feature-block-icon">⭐</div>
                <h3>Personalized Watchlists</h3>
                <p>
                  Build and manage a custom watchlist stored in MongoDB. Add any stock ticker
                  and track it alongside live prices. Your watchlist syncs across sessions
                  with secure JWT authentication.
                </p>
              </div>
              <div className="tt-feature-block-visual">
                <div className="tt-watchlist-mock">
                  {[
                    { sym: 'RELIANCE', price: '$2,548', chg: '+1.8%', up: true },
                    { sym: 'TCS', price: '$3,812', chg: '+0.6%', up: true },
                    { sym: 'INFY', price: '$1,490', chg: '-0.3%', up: false },
                    { sym: 'HDFCBANK', price: '$1,634', chg: '+1.1%', up: true },
                  ].map((s, i) => (
                    <div key={i} className="tt-wl-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.55rem', fontWeight: 700, color: '#fff'
                        }}>{s.sym.slice(0, 2)}</div>
                        <span className="tt-wl-sym">{s.sym}</span>
                      </div>
                      <span className="tt-wl-price" style={{ color: s.up ? '#10b981' : '#ef4444' }}>
                        {s.price}
                        <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem' }}>{s.chg}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Block 4 */}
            <div className="tt-feature-block reverse fade-in-up">
              <div>
                <div className="tt-feature-block-icon">📰</div>
                <h3>Market News & Global Events</h3>
                <p>
                  Stay informed with curated market news from major financial sources, filtered
                  by relevance to your tracked stocks. Understand how global events affect your
                  portfolio in real-time.
                </p>
              </div>
              <div className="tt-feature-block-visual" style={{ flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-start' }}>
                {[
                  { src: 'Reuters', headline: 'RBI holds repo rate at 6.5%, signals pivot', time: '2h ago', color: '#60a5fa' },
                  { src: 'ET Markets', headline: 'FII inflows surge amid strong Q3 earnings', time: '4h ago', color: '#34d399' },
                  { src: 'Moneycontrol', headline: 'Sensex recovers 400 pts as IT stocks rally', time: '6h ago', color: '#a78bfa' },
                ].map((n, i) => (
                  <div key={i} style={{
                    padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px', borderLeft: `3px solid ${n.color}`, width: '100%'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: n.color }}>{n.src}</span>
                      <span style={{ fontSize: '0.6rem', color: '#334155' }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>{n.headline}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block 5 */}
            <div className="tt-feature-block fade-in-up">
              <div>
                <div className="tt-feature-block-icon">💹</div>
                <h3>Interactive Charts & Data Visualization</h3>
                <p>
                  Full-featured candlestick charts with OHLC data, volume bars, crosshair
                  tooltips, and timeframe selectors. Switch between intraday, weekly, and
                  monthly views seamlessly.
                </p>
              </div>
              <div className="tt-feature-block-visual">
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    {['1D', '1W', '1M', '3M'].map((t, i) => (
                      <span key={t} style={{
                        fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '5px',
                        background: i === 0 ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.05)',
                        color: i === 0 ? '#93c5fd' : '#475569', fontWeight: 600, cursor: 'pointer'
                      }}>{t}</span>
                    ))}
                  </div>
                  <div className="tt-mock-chart" style={{ height: '100px' }}>
                    <Sparkline color="#3b82f6" points={[[0, 45], [8, 40], [16, 55], [24, 38], [32, 60], [40, 42], [48, 68], [56, 50], [64, 72], [72, 58], [80, 80], [88, 65], [100, 75]]} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.4rem' }}>
                    Powered by lightweight-charts · TradingView-style UX
                  </div>
                </div>
              </div>
            </div>

            {/* Block 6 */}
            <div className="tt-feature-block reverse fade-in-up">
              <div>
                <div className="tt-feature-block-icon">🔒</div>
                <h3>Secure Authentication & User Data Protection</h3>
                <p>
                  Full user registration and login with bcrypt-hashed passwords, JWT session
                  tokens, and route-level protection. Google OAuth integration for a seamless
                  sign-in experience.
                </p>
              </div>
              <div className="tt-feature-block-visual" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: '🔑', label: 'JWT Authentication', color: '#10b981' },
                  { icon: '🔐', label: 'bcrypt Password Hashing', color: '#60a5fa' },
                  { icon: 'G', label: 'Google OAuth 2.0', color: '#f59e0b' },
                  { icon: '🛡️', label: 'Route-Level Protection', color: '#a78bfa' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px', borderLeft: `2px solid ${item.color}`
                  }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>{item.label}</span>
                    <i className="bi bi-check-circle-fill ms-auto" style={{ color: item.color, fontSize: '0.85rem' }} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. WHO IS TRADETRACK FOR?
          ════════════════════════════════════════ */}
      <section className="tt-section" id="who-its-for">
        <div className="container">
          <div className="tt-section-label fade-in-up">For Everyone</div>
          <h2 className="tt-section-title fade-in-up delay-1">Who Is TradeTrack For?</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            Whether you are just starting out or actively tracking — TradeTrack is designed for you.
          </p>
          <div className="tt-for-grid">
            {[
              {
                icon: '🎓',
                title: 'Students',
                desc: 'Learn stock market analysis through hands-on data exploration and real indicators.',
                delay: '',
              },
              {
                icon: '🌱',
                title: 'Beginner Investors',
                desc: 'Start your investment journey with clean, simplified data and guided insights.',
                delay: 'delay-1',
              },
              {
                icon: '⚡',
                title: 'Active Traders',
                desc: 'Make faster, data-driven decisions with live prices, technical indicators, and watchlists.',
                delay: 'delay-2',
              },
              {
                icon: '📋',
                title: 'Long-Term Planners',
                desc: 'Track your portfolio, analyze sector performance, and plan for the future with confidence.',
                delay: 'delay-3',
              },
            ].map((c, i) => (
              <div key={i} className={`tt-for-card fade-in-up ${c.delay}`}>
                <span className="tt-for-icon">{c.icon}</span>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. MARKET SNAPSHOT STRIP
          ════════════════════════════════════════ */}
      <section className="tt-section tt-section-alt" id="market-snapshot">
        <div className="container">
          <div className="tt-section-label fade-in-up">Live Data</div>
          <h2 className="tt-section-title fade-in-up delay-1">Market Snapshot</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            A quick glance at current market sentiment and major indices.
          </p>

          <div className="tt-snapshot-strip fade-in-up delay-2">
            <div className="tt-snapshot-inner">

              <div className="tt-snap-item">
                <span className="tt-snap-label">NIFTY 50</span>
                <span className="tt-snap-value">22,126</span>
                <span className="tt-snap-change up">
                  <i className="bi bi-caret-up-fill" />+1.24%
                </span>
                <span className="tt-snap-updated">
                  <i className="bi bi-arrow-clockwise tt-refresh-spin" />Last updated: 09:15 AM
                </span>
              </div>

              <div className="tt-snap-item">
                <span className="tt-snap-label">SENSEX</span>
                <span className="tt-snap-value">72,854</span>
                <span className="tt-snap-change up">
                  <i className="bi bi-caret-up-fill" />+0.91%
                </span>
                <span className="tt-snap-updated">
                  <i className="bi bi-arrow-clockwise tt-refresh-spin" />Last updated: 09:15 AM
                </span>
              </div>

              <div className="tt-snap-item">
                <span className="tt-snap-label">INDIA VIX</span>
                <span className="tt-snap-value">14.22</span>
                <span className="tt-snap-change" style={{ color: '#f59e0b' }}>
                  <i className="bi bi-dash" />Moderate Risk
                </span>
                <span className="tt-snap-updated">
                  <i className="bi bi-arrow-clockwise tt-refresh-spin" />Last updated: 09:15 AM
                </span>
              </div>

              <div className="tt-snap-item">
                <span className="tt-snap-label">Market Mood</span>
                <span className="tt-snap-value" style={{ fontSize: '1.1rem', paddingTop: '0.3rem' }}>
                  <span className="tt-mood-bullish">
                    <i className="bi bi-graph-up-arrow" />Bullish
                  </span>
                </span>
                <span className="tt-snap-change up">
                  <i className="bi bi-emoji-smile" />Positive Sentiment
                </span>
                <span className="tt-snap-updated">
                  <i className="bi bi-arrow-clockwise tt-refresh-spin" />Last updated: 09:15 AM
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. HOW IT WORKS — 3-STEP TIMELINE
          ════════════════════════════════════════ */}
      <section className="tt-section" id="how-it-works">
        <div className="container">
          <div className="tt-section-label fade-in-up">Simple Process</div>
          <h2 className="tt-section-title fade-in-up delay-1">How It Works</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            Get started in minutes. Three easy steps to transform your market analysis workflow.
          </p>

          <div className="tt-steps-wrap fade-in-up delay-2">
            {/* Connecting line */}
            <div className="tt-steps-line" />

            {[
              {
                num: '1',
                icon: 'bi-search',
                title: 'Search a Stock',
                desc: 'Enter any NSE/BSE symbol or company name to retrieve deep live market data instantly.',
              },
              {
                num: '2',
                icon: 'bi-graph-up',
                title: 'Analyze Trends with Indicators',
                desc: 'Use RSI, MACD, Moving Averages, and Bollinger Bands overlaid on interactive candlestick charts.',
              },
              {
                num: '3',
                icon: 'bi-bookmark-plus',
                title: 'Add to Watchlist & Decide',
                desc: 'Save stocks to your personal watchlist and make confident, data-backed investment decisions.',
              },
            ].map((s, i) => (
              <div key={i} className="tt-step">
                <div className="tt-step-num">{s.num}</div>
                <div className="tt-step-icon-wrap">
                  <i className={`bi ${s.icon}`} />
                </div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          7. KEY METRICS
          ════════════════════════════════════════ */}
      <section className="tt-section tt-section-alt" id="metrics">
        <div className="container">
          <div className="tt-section-label fade-in-up">By The Numbers</div>
          <h2 className="tt-section-title fade-in-up delay-1">Key Metrics</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            TradeTrack is built for scale, reliability, and real-time performance.
          </p>

          <div className="tt-metrics-grid">
            {[
              { icon: '📈', num: 500, suffix: '+', label: 'Stocks Tracked' },
              { icon: '⚡', num: 99, suffix: '.9%', label: 'Uptime Architecture' },
              { icon: '🌐', num: 1, suffix: ' API', label: 'Real-Time Integration' },
              { icon: '🚀', num: 50, suffix: 'ms', label: 'Avg. Data Response' },
            ].map((m, i) => (
              <div key={i} className={`tt-metric-card fade-in-up delay-${i + 1}`}>
                <span className="tt-metric-icon">{m.icon}</span>
                <div className="tt-metric-num">
                  <AnimatedCounter target={m.num} suffix={m.suffix} />
                </div>
                <div className="tt-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          8. TECHNOLOGY STACK
          ════════════════════════════════════════ */}
      <section className="tt-section" id="tech-stack">
        <div className="container">
          <div className="tt-section-label fade-in-up">Under the Hood</div>
          <h2 className="tt-section-title fade-in-up delay-1">Technology Stack</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            A modern, full-stack foundation powering every feature.
          </p>

          <div className="tt-tech-grid fade-in-up delay-2">
            {[
              { icon: '🍃', name: 'MongoDB', sub: 'Database' },
              { icon: '⚙️', name: 'Express.js', sub: 'Backend API' },
              { icon: '⚛️', name: 'React.js', sub: 'Frontend UI' },
              { icon: '🟢', name: 'Node.js', sub: 'Server Runtime' },
              { icon: '📡', name: 'Finnhub API', sub: 'Market Data' },
            ].map((t, i) => (
              <div key={i} className="tt-tech-item">
                <span className="tt-tech-icon">{t.icon}</span>
                <div className="tt-tech-name">{t.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.2rem' }}>{t.sub}</div>
              </div>
            ))}
          </div>

          <div className="tt-tech-desc fade-in-up delay-3">
            TradeTrack is built using the <strong>MERN stack</strong> with a RESTful
            architecture to ensure <strong>scalability, speed</strong>, and{' '}
            <strong>real-time data processing</strong>. Node.js handles concurrent API
            calls efficiently while React ensures a reactive, lag-free user experience.
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          9. SYSTEM ARCHITECTURE
          ════════════════════════════════════════ */}
      <section className="tt-section tt-section-alt" id="architecture">
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="tt-section-label fade-in-up">System Design</div>
          <h2 className="tt-section-title fade-in-up delay-1">Architecture Overview</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            A clean data flow from frontend request to database and back.
          </p>

          <div className="tt-arch-flow fade-in-up delay-2">
            {[
              { icon: '👤', label: 'User' },
              { icon: '⚛️', label: 'React Frontend' },
              { icon: '⚙️', label: 'Node.js Backend' },
              { icon: '📡', label: 'Finnhub API' },
              { icon: '🍃', label: 'MongoDB' },
            ].reduce((acc, node, i, arr) => {
              acc.push(
                <div key={`node-${i}`} className="tt-arch-node">
                  <span className="tt-arch-node-icon">{node.icon}</span>
                  <span className="tt-arch-node-label">{node.label}</span>
                </div>
              );
              if (i < arr.length - 1) {
                acc.push(
                  <span key={`arrow-${i}`} className="tt-arch-arrow">
                    <i className="bi bi-arrow-right" />
                  </span>
                );
              }
              return acc;
            }, [])}
          </div>

          <p className="tt-arch-desc fade-in-up delay-3">
            When a user searches for a stock, the React frontend sends an authenticated
            request to the Node.js + Express backend. The backend validates the JWT,
            fetches live data from the Finnhub API, applies any business logic,
            saves search history to MongoDB, and returns the processed data — all
            within milliseconds.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          10. FUTURE ENHANCEMENTS
          ════════════════════════════════════════ */}
      <section className="tt-section" id="future">
        <div className="container">
          <div className="tt-section-label fade-in-up">What's Next</div>
          <h2 className="tt-section-title fade-in-up delay-1">Future Enhancements</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            TradeTrack is evolving. Here's what's on the roadmap.
          </p>

          <div className="tt-future-grid">
            {[
              {
                icon: '🤖',
                title: 'AI-Based Stock Prediction',
                desc: 'Machine learning models trained on historical data to forecast near-term price movements.',
                delay: '',
              },
              {
                icon: '📊',
                title: 'Portfolio Performance Analytics',
                desc: 'Deep portfolio analytics including P&L tracking, sector allocation, and return attribution.',
                delay: 'delay-1',
              },
              {
                icon: '🗞️',
                title: 'News Sentiment Analysis',
                desc: 'NLP-powered sentiment scoring on financial news to surface bullish or bearish signals.',
                delay: 'delay-2',
              },
              {
                icon: '📱',
                title: 'Mobile Application Version',
                desc: 'React Native mobile app for iOS and Android with push notifications for price alerts.',
                delay: 'delay-3',
              },
            ].map((f, i) => (
              <div key={i} className={`tt-future-card fade-in-up ${f.delay}`}>
                <div className="tt-future-icon">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                  <span className="tt-coming-badge">Coming Soon</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          11. DISCLAIMER
          ════════════════════════════════════════ */}
      <section className="tt-section tt-section-alt" id="about-section">
        <div className="container">
          <div className="tt-section-label fade-in-up">Important Notice</div>
          <h2 className="tt-section-title fade-in-up delay-1">Disclaimer</h2>
          <p className="tt-section-sub fade-in-up delay-2" style={{ marginBottom: '2rem' }}>
            Please read this before making any investment decisions.
          </p>

          <div className="tt-disclaimer fade-in-up delay-2">
            <span className="tt-disclaimer-icon">⚠️</span>
            <p className="tt-disclaimer-text" style={{ margin: 0 }}>
              <strong>TradeTrack does not provide financial advice.</strong> Market data
              displayed on this platform may be delayed and is intended{' '}
              <strong>for educational and informational purposes only.</strong> TradeTrack
              is a student project built to demonstrate MERN stack capabilities. Any
              investment decisions made based on data from this platform are solely the
              responsibility of the user. Always consult a SEBI-registered financial advisor
              before investing.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          12. FINAL CTA BANNER
          ════════════════════════════════════════ */}
      <section className="tt-cta-section">
        <div className="container">
          <h2 className="tt-cta-title fade-in-up">
            Ready to trade smarter?
          </h2>
          <p className="tt-cta-sub fade-in-up delay-1">
            Join thousands of traders who use TradeTrack to stay ahead of the market.
            Start your analysis journey today — it's free.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap fade-in-up delay-2">
            {isAuthenticated ? (
              <button
                id="cta-go-dashboard-btn"
                className="tt-btn-primary"
                onClick={goToDashboard}
              >
                <i className="bi bi-grid-1x2-fill" />
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  id="cta-get-started-btn"
                  className="tt-btn-primary"
                  onClick={goToRegister}
                >
                  <i className="bi bi-rocket-takeoff-fill" />
                  Get Started Free
                </button>
                <button
                  id="cta-view-dashboard-btn"
                  className="tt-btn-secondary"
                  onClick={goToDashboard}
                >
                  <i className="bi bi-bar-chart-line-fill" />
                  View Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

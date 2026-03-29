import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ──────────────────────────────────────────
   SCROLL ANIMATION HOOK
   ────────────────────────────────────────── */
function useScrollFadeIn() {
  useEffect(() => {
    const targets = document.querySelectorAll(
      ".fade-in-up, .fade-in-left, .fade-in-right",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ──────────────────────────────────────────
   ANIMATED COUNTER
   ────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 1800 }) {
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
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ──────────────────────────────────────────
   MINI SVG SPARKLINE (decorative)
   ────────────────────────────────────────── */
function Sparkline({ color = "#10b981", points }) {
  const defaultPoints = points || [
    [0, 40],
    [10, 35],
    [20, 42],
    [30, 28],
    [40, 33],
    [50, 20],
    [60, 25],
    [70, 15],
    [80, 22],
    [90, 10],
    [100, 18],
  ];
  const w = 100,
    h = 50;
  const xs = defaultPoints.map(([x]) => x);
  const ys = defaultPoints.map(([, y]) => y);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const toSvg = ([x, y]) => [
    (x / Math.max(...xs)) * w,
    h - ((y - minY) / (maxY - minY || 1)) * h * 0.8 - h * 0.1,
  ];
  const svgPoints = defaultPoints.map(toSvg);
  const linePath = svgPoints
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const areaPath = `${linePath} L${svgPoints[svgPoints.length - 1][0]},${h} L${svgPoints[0][0]},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace("#", "")})`} />
      <path
        d={linePath}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ──────────────────────────────────────────
   MAIN HOME COMPONENT
   ────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  useScrollFadeIn();

  const goToRegister = () => navigate("/register");
  const goToLogin = () => navigate("/login");

  useEffect(() => {
    const timer = window.setTimeout(() => setSnapshotLoading(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const smoothScroll = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
                Track <span style={{ color: "var(--primary)" }}>smarter</span>.
                <br />
                <span className="gradient-text">Invest wiser.</span>
              </h1>

              <p className="tt-hero-sub fade-in-up delay-2">
                The professional-grade platform for tracking US stocks,
                monitoring your portfolio performance, and getting AI-powered
                market insights — all in one place.
              </p>

              <div className="tt-hero-cta fade-in-up delay-3">
                <button
                  id="hero-view-dashboard-btn"
                  className="tt-btn-primary"
                  onClick={goToRegister}
                >
                  <i className="bi bi-bar-chart-line-fill" />
                  Start Tracking Free
                </button>
                <a
                  id="hero-explore-features-btn"
                  href="#how-it-works"
                  className="tt-btn-secondary"
                  onClick={(e) => smoothScroll(e, "how-it-works")}
                >
                  <i className="bi bi-compass" />
                  See how it works →
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
                <div className="tt-market-snapshot-head">
                  <span className="tt-market-snapshot-badge">🟢 LIVE DATA</span>
                  <div className="tt-market-snapshot-title">
                    US Market Snapshot
                  </div>
                  <div className="tt-market-snapshot-subtitle">
                    Real-time data from Finnhub API · Updates every 60s
                  </div>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">S&amp;P 500</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tt-index-val">5,248.60</div>
                    <div className="tt-index-change up">
                      <i className="bi bi-caret-up-fill" />
                      +32.40 (+0.62%)
                    </div>
                  </div>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">NASDAQ</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tt-index-val">16,432.75</div>
                    <div className="tt-index-change up">
                      <i className="bi bi-caret-up-fill" />
                      +118.12 (+0.72%)
                    </div>
                  </div>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">Dow Jones</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tt-index-val">39,802.11</div>
                    <div className="tt-index-change down">
                      <i className="bi bi-caret-down-fill" />
                      -41.25 (-0.10%)
                    </div>
                  </div>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">NIFTY 50</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tt-index-val">22,126.80</div>
                    <div className="tt-index-change up">
                      <i className="bi bi-caret-up-fill" />
                      +276.40 (+1.26%)
                    </div>
                  </div>
                </div>

                <div className="tt-index-row">
                  <div>
                    <div className="tt-index-name">INDIA VIX</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tt-index-val">14.22</div>
                    <span className="tt-vix-badge">Moderate Risk</span>
                  </div>
                </div>

                <div className="tt-mini-chart" style={{ marginTop: "1.25rem" }}>
                  <Sparkline color="#10b981" />
                </div>

                <div className="tt-market-snapshot-note">
                  For informational purposes only. Not financial advice.
                </div>

                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#334155",
                    marginTop: "0.6rem",
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "0.3rem",
                  }}
                >
                  <i
                    className="bi bi-arrow-clockwise"
                    style={{ animation: "spin 3s linear infinite" }}
                  />
                  Updated just now
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tt-trust-bar" aria-label="Platform trust highlights">
        <div className="container">
          <div className="tt-trust-bar-grid">
            <div className="tt-trust-bar-item">
              <span className="tt-trust-bar-icon">📊</span>
              <span className="tt-trust-bar-text">8,000+ US Stocks</span>
            </div>
            <div className="tt-trust-bar-item">
              <span className="tt-trust-bar-icon">⚡</span>
              <span className="tt-trust-bar-text">Real-Time Finnhub Data</span>
            </div>
            <div className="tt-trust-bar-item">
              <span className="tt-trust-bar-icon">🤖</span>
              <span className="tt-trust-bar-text">AI-Powered Analysis</span>
            </div>
            <div className="tt-trust-bar-item">
              <span className="tt-trust-bar-icon">🔒</span>
              <span className="tt-trust-bar-text">Free to Use</span>
            </div>
            <div className="tt-trust-bar-item">
              <span className="tt-trust-bar-icon">📰</span>
              <span className="tt-trust-bar-text">Live Reuters News</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. DETAILED FEATURES (2-COL BLOCKS)
          ════════════════════════════════════════ */}
      <section className="tt-section tt-section-alt" id="features">
        <div className="container">
          <div className="tt-section-label fade-in-up">Feature Breakdown</div>
          <h2 className="tt-section-title fade-in-up delay-1">
            Everything You Need
          </h2>
          <p className="tt-section-sub fade-in-up delay-2">
            Everything you need to track US stocks like a professional
          </p>

          <div className="tt-features-blocks">
            {/* Block 1 */}
            <div className="tt-feature-block fade-in-up">
              <div>
                <div className="tt-feature-block-icon">📈</div>
                <h3>Real-Time US Stock Prices</h3>
                <p>
                  Track live prices for 8,000+ US stocks across NYSE and NASDAQ.
                  Prices update every 60 seconds directly from Finnhub.
                </p>
              </div>
              <div className="tt-feature-block-visual">
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      RELIANCE.NS
                    </span>
                    <span className="tt-mock-badge">+1.8%</span>
                  </div>
                  <div className="tt-mock-chart">
                    <Sparkline
                      color="#10b981"
                      points={[
                        [0, 30],
                        [10, 25],
                        [20, 35],
                        [30, 22],
                        [40, 38],
                        [50, 28],
                        [60, 42],
                        [70, 32],
                        [80, 48],
                        [90, 38],
                        [100, 52],
                      ]}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.6rem",
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "#475569" }}>
                      L: $2,410
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#f1f5f9",
                        fontWeight: 700,
                      }}
                    >
                      $2,548.30
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#475569" }}>
                      H: $2,562
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2 */}
            <div className="tt-feature-block reverse fade-in-up">
              <div>
                <div className="tt-feature-block-icon">🔬</div>
                <h3>Portfolio P&amp;L Tracking</h3>
                <p>
                  Log your existing investments and instantly see your profit or
                  loss based on current market prices. No account setup needed.
                </p>
                <div
                  className="tt-mock-indicator-row"
                  style={{ marginTop: "1.25rem" }}
                >
                  <span className="tt-indicator-chip">RSI</span>
                  <span className="tt-indicator-chip">MACD</span>
                  <span className="tt-indicator-chip">EMA 20</span>
                  <span className="tt-indicator-chip">SMA 50</span>
                  <span className="tt-indicator-chip">Bollinger Bands</span>
                </div>
              </div>
              <div className="tt-feature-block-visual">
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    RSI (14) — Momentum
                  </div>
                  <Sparkline
                    color="#a78bfa"
                    points={[
                      [0, 55],
                      [10, 58],
                      [20, 62],
                      [30, 70],
                      [40, 68],
                      [50, 72],
                      [60, 65],
                      [70, 60],
                      [80, 55],
                      [90, 50],
                      [100, 45],
                    ]}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", color: "#10b981" }}>
                      Oversold: 30
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#a78bfa",
                        fontWeight: 700,
                      }}
                    >
                      RSI: 55.4
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#ef4444" }}>
                      Overbought: 70
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3 */}
            <div className="tt-feature-block fade-in-up">
              <div>
                <div className="tt-feature-block-icon">⭐</div>
                <h3>AI-Powered Market Insights</h3>
                <p>
                  Get AI signal predictions (Bullish/Bearish/Neutral) and
                  technical analysis for any US stock — RSI, SMA, EMA and more.
                </p>
              </div>
              <div className="tt-feature-block-visual">
                <div className="tt-watchlist-mock">
                  {[
                    {
                      sym: "RELIANCE",
                      price: "$2,548",
                      chg: "+1.8%",
                      up: true,
                    },
                    { sym: "TCS", price: "$3,812", chg: "+0.6%", up: true },
                    { sym: "INFY", price: "$1,490", chg: "-0.3%", up: false },
                    {
                      sym: "HDFCBANK",
                      price: "$1,634",
                      chg: "+1.1%",
                      up: true,
                    },
                  ].map((s, i) => (
                    <div key={i} className="tt-wl-row">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,#2563eb,#1d4ed8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {s.sym.slice(0, 2)}
                        </div>
                        <span className="tt-wl-sym">{s.sym}</span>
                      </div>
                      <span
                        className="tt-wl-price"
                        style={{ color: s.up ? "#10b981" : "#ef4444" }}
                      >
                        {s.price}
                        <span
                          style={{ fontSize: "0.7rem", marginLeft: "0.3rem" }}
                        >
                          {s.chg}
                        </span>
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
                <h3>Smart Watchlist</h3>
                <p>
                  Add any US stock to your watchlist and monitor price
                  movements, percentage changes, and alerts in real time.
                </p>
              </div>
              <div
                className="tt-feature-block-visual"
                style={{
                  flexDirection: "column",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                }}
              >
                {[
                  {
                    src: "Reuters",
                    headline: "RBI holds repo rate at 6.5%, signals pivot",
                    time: "2h ago",
                    color: "#60a5fa",
                  },
                  {
                    src: "ET Markets",
                    headline: "FII inflows surge amid strong Q3 earnings",
                    time: "4h ago",
                    color: "#34d399",
                  },
                  {
                    src: "Moneycontrol",
                    headline: "Sensex recovers 400 pts as IT stocks rally",
                    time: "6h ago",
                    color: "#a78bfa",
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.6rem 0.75rem",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "8px",
                      borderLeft: `3px solid ${n.color}`,
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          color: n.color,
                        }}
                      >
                        {n.src}
                      </span>
                      <span style={{ fontSize: "0.6rem", color: "#334155" }}>
                        {n.time}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#94a3b8",
                        lineHeight: 1.4,
                      }}
                    >
                      {n.headline}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block 5 */}
            <div className="tt-feature-block fade-in-up">
              <div>
                <div className="tt-feature-block-icon">💹</div>
                <h3>Live Market News</h3>
                <p>
                  Stay informed with real-time Reuters financial news filtered
                  by market, sector, crypto, forex, and more.
                </p>
              </div>
              <div className="tt-feature-block-visual">
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      marginBottom: "0.6rem",
                    }}
                  >
                    {["1D", "1W", "1M", "3M"].map((t, i) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "0.65rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "5px",
                          background:
                            i === 0
                              ? "rgba(37,99,235,0.3)"
                              : "rgba(255,255,255,0.05)",
                          color: i === 0 ? "#93c5fd" : "#475569",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="tt-mock-chart" style={{ height: "100px" }}>
                    <Sparkline
                      color="#3b82f6"
                      points={[
                        [0, 45],
                        [8, 40],
                        [16, 55],
                        [24, 38],
                        [32, 60],
                        [40, 42],
                        [48, 68],
                        [56, 50],
                        [64, 72],
                        [72, 58],
                        [80, 80],
                        [88, 65],
                        [100, 75],
                      ]}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#334155",
                      marginTop: "0.4rem",
                    }}
                  >
                    Powered by lightweight-charts · Professional charting UX
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
                  Full user registration and login with bcrypt-hashed passwords,
                  JWT session tokens, and route-level protection. Google OAuth
                  integration for a seamless sign-in experience.
                </p>
              </div>
              <div
                className="tt-feature-block-visual"
                style={{ flexDirection: "column", gap: "0.75rem" }}
              >
                {[
                  { icon: "🔑", label: "JWT Authentication", color: "#10b981" },
                  {
                    icon: "🔐",
                    label: "bcrypt Password Hashing",
                    color: "#60a5fa",
                  },
                  { icon: "G", label: "Google OAuth 2.0", color: "#f59e0b" },
                  {
                    icon: "🛡️",
                    label: "Route-Level Protection",
                    color: "#a78bfa",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "8px",
                      borderLeft: `2px solid ${item.color}`,
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </span>
                    <i
                      className="bi bi-check-circle-fill ms-auto"
                      style={{ color: item.color, fontSize: "0.85rem" }}
                    />
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
          <h2 className="tt-section-title fade-in-up delay-1">
            Who Is TradeTrack For?
          </h2>
          <p className="tt-section-sub fade-in-up delay-2">
            TradeTrack works for anyone who wants to monitor US markets
          </p>
          <div className="tt-for-grid">
            {[
              {
                icon: "📈",
                title: "Casual Investors",
                desc: "You already own US stocks but want an easy way to see everything in one place. TradeTrack gives you a clear view of your portfolio performance without the complexity.",
                delay: "",
              },
              {
                icon: "🔍",
                title: "Market Watchers",
                desc: "You follow US stocks closely and want real-time prices, technical indicators, and AI signals to stay ahead of market movements — without paying for expensive tools.",
                delay: "delay-1",
              },
              {
                icon: "📰",
                title: "News-Driven Investors",
                desc: "You make decisions based on market news and sector trends. TradeTrack combines live Reuters news with stock data so you always have context behind the numbers.",
                delay: "delay-2",
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
          5. KEY METRICS
          ════════════════════════════════════════ */}
      <section className="tt-section tt-section-alt" id="market-data">
        <div className="container">
          <div className="tt-section-label fade-in-up">Product Snapshot</div>
          <h2 className="tt-section-title fade-in-up delay-1">Key Metrics</h2>
          <p className="tt-section-sub fade-in-up delay-2">
            Honest product metrics for investors tracking the US market.
          </p>

          <div className="tt-snapshot-strip fade-in-up delay-2">
            <div className="tt-snapshot-inner">
              <div className="tt-snap-item">
                <span className="tt-snap-label">US Stocks Available</span>
                {snapshotLoading ? (
                  <>
                    <span
                      className="tt-snap-value tt-snap-value-skeleton"
                      aria-hidden="true"
                    />
                    <span
                      className="tt-snap-change tt-snap-change-skeleton"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    <span className="tt-snap-value">8,000+</span>
                    <span className="tt-snap-change up">
                      <i className="bi bi-graph-up-arrow" />
                      NYSE, NASDAQ &amp; more
                    </span>
                  </>
                )}
              </div>
              <div className="tt-snap-item">
                <span className="tt-snap-label">Market Data</span>
                {snapshotLoading ? (
                  <>
                    <span
                      className="tt-snap-value tt-snap-value-skeleton"
                      aria-hidden="true"
                    />
                    <span
                      className="tt-snap-change tt-snap-change-skeleton"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    <span className="tt-snap-value">Real-Time</span>
                    <span className="tt-snap-change up">
                      <i className="bi bi-lightning-charge-fill" />
                      Powered by Finnhub API
                    </span>
                  </>
                )}
              </div>
              <div className="tt-snap-item">
                <span className="tt-snap-label">Price Refresh Rate</span>
                {snapshotLoading ? (
                  <>
                    <span
                      className="tt-snap-value tt-snap-value-skeleton"
                      aria-hidden="true"
                    />
                    <span
                      className="tt-snap-change tt-snap-change-skeleton"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    <span className="tt-snap-value">60s</span>
                    <span className="tt-snap-change up">
                      <i className="bi bi-arrow-clockwise tt-refresh-spin" />
                      Live updates every minute
                    </span>
                  </>
                )}
              </div>
              <div className="tt-snap-item">
                <span className="tt-snap-label">To Get Started</span>
                {snapshotLoading ? (
                  <>
                    <span
                      className="tt-snap-value tt-snap-value-skeleton"
                      aria-hidden="true"
                    />
                    <span
                      className="tt-snap-change tt-snap-change-skeleton"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    <span className="tt-snap-value">Free</span>
                    <span className="tt-snap-change up">
                      <i className="bi bi-check-circle-fill" />
                      No credit card required
                    </span>
                  </>
                )}
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
            Get started in minutes — no account setup or credit card needed
          </p>

          <div className="tt-steps-wrap fade-in-up delay-2">
            {/* Connecting line */}
            <div className="tt-steps-line" />

            <div className="tt-step">
              <div className="tt-step-num">01</div>
              <div className="tt-step-icon-wrap">
                <i className="bi bi-search" />
              </div>
              <h4>Create Your Free Account</h4>
              <p>
                Sign up in under a minute. No credit card, no account connection
                required. Just your email.
              </p>
            </div>
            <div className="tt-step">
              <div className="tt-step-num">02</div>
              <div className="tt-step-icon-wrap">
                <i className="bi bi-graph-up" />
              </div>
              <h4>Search and Track US Stocks</h4>
              <p>
                Search any US stock by name or ticker. Add stocks to your
                watchlist for live price tracking, or log investments you
                already own to monitor your portfolio performance.
              </p>
            </div>
            <div className="tt-step">
              <div className="tt-step-num">03</div>
              <div className="tt-step-icon-wrap">
                <i className="bi bi-bookmark-plus" />
              </div>
              <h4>Get AI Insights and Stay Informed</h4>
              <p>
                View AI signal predictions, technical analysis, analyst
                recommendations, and live Reuters news — all on one page per
                stock. Make more informed decisions.
              </p>
            </div>
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
          <p
            className="tt-section-sub fade-in-up delay-2"
            style={{ marginBottom: "2rem" }}
          >
            Please read this before making any investment decisions.
          </p>

          <div className="tt-disclaimer fade-in-up delay-2">
            <span className="tt-disclaimer-icon">⚠️</span>
            <p className="tt-disclaimer-text" style={{ margin: 0 }}>
              <strong>Disclaimer:</strong> TradeTrack is for informational and
              educational purposes only. We do not provide financial or
              investment advice. All market data is sourced from Finnhub API.
              Stock prices and AI predictions shown are not recommendations.
              Always conduct your own research and consult a qualified financial
              advisor before making investment decisions.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          12. FINAL CTA BANNER
          ════════════════════════════════════════ */}
      <section className="tt-cta-section">
        <div className="container">
          <h2 className="tt-cta-title fade-in-up">Ready to track smarter?</h2>
          <p className="tt-cta-sub fade-in-up delay-1">
            Join investors who use TradeTrack to monitor US stocks, track
            portfolio performance, and stay ahead of the market.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap fade-in-up delay-2">
            <button
              id="cta-create-account-btn"
              className="tt-btn-primary"
              onClick={goToRegister}
            >
              <i className="bi bi-rocket-takeoff-fill" />
              Create Free Account
            </button>
            <button
              id="cta-sign-in-btn"
              className="tt-btn-secondary"
              onClick={goToLogin}
            >
              <i className="bi bi-box-arrow-in-right" />
              Sign in →
            </button>
          </div>
          <div
            style={{
              marginTop: "0.9rem",
              fontSize: "0.78rem",
              color: "#64748b",
              letterSpacing: "0.02em",
            }}
            className="fade-in-up delay-3"
          >
            Free to use · No credit card · US stocks only
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Price_Chart from "../components/Price_Chart";
import Technical_Analysis from "../components/Technical_Analysis";
import Footer from "../components/Footer";
import watchlistService from "../services/watchlistService";
import authService from "../services/authService";
import {
    fetchCompanyProfile,
    fetchQuote,
    fetchCandles,
    fetchMetrics,
    fetchRecommendation,
    fetchEarnings
} from "../services/finnhub";

// --------------------------------------------------------------------------
// Stats Row (bottom of chart) - mirrors the reference image
// --------------------------------------------------------------------------
function StockStatsBar({ quote, candles, metrics }) {
    if (!quote) return null;

    const m = metrics?.metric || {};
    const prevClose = quote.pc ?? 0;
    const open = quote.o ?? 0;
    const dayLow = quote.l ?? 0;
    const dayHigh = quote.h ?? 0;
    const price = quote.c ?? 0;

    // Day volatility %
    const dayVolatility = price > 0 ? (((dayHigh - dayLow) / price) * 100).toFixed(2) : '0.00';
    const dayRangePos = dayHigh > dayLow ? (price - dayLow) / (dayHigh - dayLow) : 0.5;

    // 52-week — prefer Finnhub metrics (exact), fallback to candle estimation
    const w52High = m['52WeekHigh'] || (candles?.h?.length ? Math.max(...candles.h) : dayHigh);
    const w52Low = m['52WeekLow'] || (candles?.l?.length ? Math.min(...candles.l) : dayLow);
    const w52Volatility = w52High > 0 ? (((w52High - w52Low) / w52High) * 100).toFixed(2) : '0.00';
    const w52RangePos = w52High > w52Low ? (price - w52Low) / (w52High - w52Low) : 0.5;

    // Fundamentals from Finnhub metrics
    const peRatio = m.peBasicExclExtraTTM ? m.peBasicExclExtraTTM.toFixed(2) : null;
    const beta = m.beta ? m.beta.toFixed(2) : null;
    const volume = quote.v ?? null;


    const fmtVol = (n) => {
        if (!n) return '—';
        if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
        return n.toLocaleString();
    };

    return (
        <div className="stock-stats-bar">
            {/* Row 1: price stats */}
            <div className="stats-row">
                <div className="stat-cell">
                    <span className="stat-label">PREVIOUS CLOSE</span>
                    <span className="stat-value">${prevClose.toFixed(2)}</span>
                </div>
                <div className="stat-cell">
                    <span className="stat-label">OPEN</span>
                    <span className="stat-value">${open.toFixed(2)}</span>
                </div>
                <div className="stat-cell range-cell">
                    <div className="range-header">
                        <span className="stat-label">LOW</span>
                        <span className="volatility-badge">DAY'S VOLATILITY: {dayVolatility}%</span>
                        <span className="stat-label">HIGH</span>
                    </div>
                    <div className="range-row">
                        <span className="stat-value">${dayLow.toFixed(2)}</span>
                        <div className="range-bar-wrap">
                            <div className="range-bar">
                                <div className="range-bar-fill" style={{ width: `${Math.min(100, dayRangePos * 100)}%` }} />
                            </div>
                        </div>
                        <span className="stat-value">${dayHigh.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            {/* Row 2: fundamentals + 52w range */}
            <div className="stats-row">
                {peRatio && (
                    <div className="stat-cell">
                        <span className="stat-label">P/E RATIO</span>
                        <span className="stat-value">{peRatio}</span>
                    </div>
                )}
                {!peRatio && (
                    <div className="stat-cell">
                        <span className="stat-label">VOLUME</span>
                        <span className="stat-value">{fmtVol(volume)}</span>
                    </div>
                )}
                <div className="stat-cell">
                    <span className="stat-label">{beta ? 'BETA' : 'VOLUME'}</span>
                    <span className="stat-value">{beta ? beta : fmtVol(volume)}</span>
                </div>
                <div className="stat-cell range-cell">
                    <div className="range-header">
                        <span className="stat-label">52W LOW</span>
                        <span className="volatility-badge">52W RANGE: {w52Volatility}%</span>
                        <span className="stat-label">52W HIGH</span>
                    </div>
                    <div className="range-row">
                        <span className="stat-value">${w52Low.toFixed(2)}</span>
                        <div className="range-bar-wrap">
                            <div className="range-bar">
                                <div className="range-bar-fill range-bar-fill-52" style={{ width: `${Math.min(100, Math.max(0, w52RangePos * 100))}%` }} />
                            </div>
                        </div>
                        <span className="stat-value">${w52High.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// Order Panel (right sidebar) - mirrors the reference image
// --------------------------------------------------------------------------
function OrderPanel({ symbol, quote, recommendation, earnings, inWatchlist, watchlistLoading, toggleWatchlist }) {
    const price = quote?.c ?? 0;
    const latestRec = Array.isArray(recommendation) && recommendation.length > 0 ? recommendation[0] : null;
    const latestEarnings = Array.isArray(earnings) && earnings.length > 0 ? earnings[0] : null;

    const strongBuy = Number(latestRec?.strongBuy ?? 0);
    const buy = Number(latestRec?.buy ?? 0);
    const hold = Number(latestRec?.hold ?? 0);
    const sell = Number(latestRec?.sell ?? 0);
    const strongSell = Number(latestRec?.strongSell ?? 0);

    const surprisePercent = Number(latestEarnings?.surprisePercent ?? 0);
    const priceMomentum = Number(quote?.dp ?? 0);

    const weightedScore =
        (strongBuy * 2 + buy) -
        (strongSell * 2 + sell) +
        (surprisePercent > 0 ? 1 : surprisePercent < 0 ? -1 : 0) +
        (priceMomentum > 0 ? 1 : priceMomentum < 0 ? -1 : 0);

    const recommendationTotal = strongBuy + buy + hold + sell + strongSell;
    const confidence = recommendationTotal > 0
        ? Math.min(95, Math.max(55, Math.round((Math.abs(weightedScore) / (recommendationTotal + 2)) * 100)))
        : 60;

    const aiSignal = weightedScore >= 3 ? 'Bullish' : weightedScore <= -3 ? 'Bearish' : 'Neutral';
    const aiClass = aiSignal === 'Bullish' ? 'pos' : aiSignal === 'Bearish' ? 'neg' : 'neu';
    const riskLevel = Math.abs(priceMomentum) >= 4 ? 'High' : Math.abs(priceMomentum) >= 2 ? 'Medium' : 'Low';
    const formatSigned = (value) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

    return (
        <div className="order-panel">
            <div className="order-panel-header">
                <div>
                    <div className="order-symbol">{symbol}</div>
                    <div className={`order-price ${(quote?.dp ?? 0) >= 0 ? 'price-up' : 'price-down'}`}>
                        ${price.toFixed(2)}
                        <span className="order-change">
                            {' '}({(quote?.dp ?? 0).toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>

            <div className="analysis-grid-2">
                <div className="analysis-chip">
                    <span>AI Signal</span>
                    <strong className={aiClass}>{aiSignal}</strong>
                </div>
                <div className="analysis-chip">
                    <span>Confidence</span>
                    <strong>{confidence}%</strong>
                </div>
            </div>

            <div className="order-section">
                <div className="order-section-label">Analyst Recommendation</div>
                <div className="analysis-rec-grid">
                    <div><span>Strong Buy</span><b>{strongBuy}</b></div>
                    <div><span>Buy</span><b>{buy}</b></div>
                    <div><span>Hold</span><b>{hold}</b></div>
                    <div><span>Sell</span><b>{sell}</b></div>
                    <div><span>Strong Sell</span><b>{strongSell}</b></div>
                    <div><span>Period</span><b>{latestRec?.period || 'N/A'}</b></div>
                </div>
            </div>

            <div className="order-section">
                <div className="order-section-label">EPS Surprise</div>
                <div className="analysis-earnings-box">
                    <div className="analysis-earnings-row">
                        <span>Actual EPS</span>
                        <b>{latestEarnings?.actual ?? 'N/A'}</b>
                    </div>
                    <div className="analysis-earnings-row">
                        <span>Estimate EPS</span>
                        <b>{latestEarnings?.estimate ?? 'N/A'}</b>
                    </div>
                    <div className="analysis-earnings-row">
                        <span>Surprise</span>
                        <b className={surprisePercent >= 0 ? 'pos' : 'neg'}>
                            {Number.isFinite(surprisePercent) ? formatSigned(surprisePercent) : 'N/A'}
                        </b>
                    </div>
                    <div className="analysis-earnings-row">
                        <span>Quarter</span>
                        <b>{latestEarnings?.quarter || 'N/A'} {latestEarnings?.year || ''}</b>
                    </div>
                </div>
            </div>

            <div className="analysis-grid-2">
                <div className="analysis-chip">
                    <span>Price Momentum</span>
                    <strong className={priceMomentum >= 0 ? 'pos' : 'neg'}>{formatSigned(priceMomentum)}</strong>
                </div>
                <div className="analysis-chip">
                    <span>Volatility Risk</span>
                    <strong className={riskLevel === 'High' ? 'neg' : riskLevel === 'Medium' ? 'neu' : 'pos'}>{riskLevel}</strong>
                </div>
            </div>

            <div className="analysis-note-box">
                <div className="analysis-note-title">AI Prediction</div>
                <p>
                    Based on analyst trend, recent momentum, and earnings surprise,
                    this stock currently shows a <strong className={aiClass}>{aiSignal}</strong> setup
                    with <strong>{confidence}%</strong> confidence.
                </p>
            </div>

            <button
                className={`watchlist-action-btn ${inWatchlist ? 'in-watchlist' : ''}`}
                onClick={toggleWatchlist}
                disabled={watchlistLoading}
            >
                {watchlistLoading ? '...' : inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
        </div>
    );
}
// Main Page
// --------------------------------------------------------------------------
export default function StockPage() {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [quote, setQuote] = useState(null);
    const [candles, setCandles] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [recommendation, setRecommendation] = useState([]);
    const [earnings, setEarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!symbol) return;
            setLoading(true);
            try {
                const [p, q, c, mx, rec, eps] = await Promise.all([
                    fetchCompanyProfile(symbol),
                    fetchQuote(symbol),
                    fetchCandles(symbol, 'D', 365),
                    fetchMetrics(symbol),
                    fetchRecommendation(symbol),
                    fetchEarnings(symbol),
                ]);
                setProfile(p);
                setQuote(q);
                setCandles(c);
                setMetrics(mx);
                setRecommendation(rec);
                setEarnings(eps);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [symbol]);

    useEffect(() => {
        let mounted = true;
        const loadWatchlist = async () => {
            if (!authService.isAuthenticated()) return;
            try {
                const list = await watchlistService.getWatchlist();
                if (mounted) setInWatchlist(list.some(i => i.symbol === symbol));
            } catch { }
        };
        loadWatchlist();
        return () => { mounted = false; };
    }, [symbol]);

    const toggleWatchlist = async () => {
        if (!authService.isAuthenticated()) {
            window.alert("Please login to manage your watchlist.");
            return;
        }
        try {
            setWatchlistLoading(true);
            if (inWatchlist) {
                await watchlistService.removeFromWatchlist(symbol);
                setInWatchlist(false);
            } else {
                await watchlistService.addToWatchlist(symbol, profile?.name || symbol, 'stock');
                setInWatchlist(true);
            }
        } catch (err) {
            window.alert(err.message || "Failed to update watchlist.");
        } finally {
            setWatchlistLoading(false);
        }
    };

    const isPos = (quote?.dp ?? 0) >= 0;

    return (
        <div className="stock-search-page">
            <div className="stock-nav-actions">
                <button
                    type="button"
                    className="btn-glass stock-back-btn"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* ── Main content area ── */}
            <div className="stock-main-layout">

                {/* ── LEFT: Chart + Stats ── */}
                <div className="stock-chart-col">
                    <div className="stock-chart-card">

                        {/* Company header */}
                        <div className="stock-card-header">
                            <div className="scard-left">
                                {profile?.logo && (
                                    <img
                                        src={profile.logo}
                                        alt={symbol}
                                        className="scard-logo"
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <div>
                                    <div className="scard-name">{profile?.name || symbol}</div>
                                    <div className="scard-meta">
                                        {profile?.exchange && <span>{profile.exchange}</span>}
                                        {symbol && <span> · {symbol}</span>}
                                        {profile?.currency && <span> · IEX Real-Time Price · {profile.currency}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="scard-right-actions">
                                <button
                                    className={`header-watchlist-btn ${inWatchlist ? 'in-wl' : ''}`}
                                    onClick={toggleWatchlist}
                                    disabled={watchlistLoading}
                                >
                                    <span>◎</span>
                                    {watchlistLoading ? '...' : inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                                </button>
                                <button className="header-icon-btn" title="Alert">🔔</button>
                                <button className="header-icon-btn" title="Share">⊕</button>
                            </div>
                        </div>

                        {/* Price row */}
                        <div className="scard-price-row">
                            <div>
                                <div className="scard-price">
                                    ${(quote?.c ?? 0).toFixed(2)}
                                    <span className={`scard-change ${isPos ? 'price-up' : 'price-down'}`}>
                                        {' '}{isPos ? '' : ''}{(quote?.d ?? 0).toFixed(2)} ({isPos ? '' : ''}{(quote?.dp ?? 0).toFixed(2)}%)
                                    </span>
                                </div>
                                <div className="scard-timestamp">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    {' · '}
                                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    {' USA '}
                                    <span className="market-open-badge">OPEN</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="scard-chart-wrap">
                            {loading ? (
                                <div className="chart-loading">
                                    <div className="spin-ring" />
                                    <span>Loading chart data…</span>
                                </div>
                            ) : (
                                // eslint-disable-next-line react/jsx-pascal-case
                                <Price_Chart
                                    symbol={symbol}
                                    candles={candles}
                                    title="Price Chart"
                                />
                            )}
                        </div>

                        {/* Stats Bar */}
                        <StockStatsBar quote={quote} candles={candles} metrics={metrics} />

                    </div>

                    {/* Technical Analysis */}
                    <div className="stock-chart-card mt-3">
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        <Technical_Analysis symbol={symbol} quote={quote} candles={candles} />
                    </div>
                </div>

                {/* ── RIGHT: Order Panel ── */}
                <div className="stock-order-col">
                    <OrderPanel
                        symbol={symbol}
                        quote={quote}
                        recommendation={recommendation}
                        earnings={earnings}
                        inWatchlist={inWatchlist}
                        watchlistLoading={watchlistLoading}
                        toggleWatchlist={toggleWatchlist}
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
}


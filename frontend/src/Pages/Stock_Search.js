import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Price_Chart from "../components/Price_Chart";
import Technical_Analysis from "../components/Technical_Analysis";
import Footer from "../components/Footer";
import toast from 'react-hot-toast';
import watchlistService from "../services/watchlistService";
import authService from "../services/authService";
import transactionService from "../services/transactionService";
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

    const dayVolatility = price > 0 ? (((dayHigh - dayLow) / price) * 100).toFixed(2) : '0.00';
    const dayRangePos = dayHigh > dayLow ? (price - dayLow) / (dayHigh - dayLow) : 0.5;

    const w52High = m['52WeekHigh'] || (candles?.h?.length ? Math.max(...candles.h) : dayHigh);
    const w52Low = m['52WeekLow'] || (candles?.l?.length ? Math.min(...candles.l) : dayLow);
    const w52Volatility = w52High > 0 ? (((w52High - w52Low) / w52High) * 100).toFixed(2) : '0.00';
    const w52RangePos = w52High > w52Low ? (price - w52Low) / (w52High - w52Low) : 0.5;

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
// Order Panel (right sidebar)
// --------------------------------------------------------------------------
function OrderPanel({ symbol, quote, recommendation, earnings, inWatchlist, watchlistLoading, toggleWatchlist, onInvestClick, onSellClick, holding }) {
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
    const aiIcon = aiSignal === 'Bullish' ? '↗' : aiSignal === 'Bearish' ? '↘' : '→';
    const aiBg = aiSignal === 'Bullish' ? 'rgba(16,185,129,0.12)' : aiSignal === 'Bearish' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)';
    const aiBorder = aiSignal === 'Bullish' ? 'rgba(16,185,129,0.25)' : aiSignal === 'Bearish' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)';
    const aiText = aiSignal === 'Bullish' ? '#10b981' : aiSignal === 'Bearish' ? '#ef4444' : '#f59e0b';
    const riskLevel = Math.abs(priceMomentum) >= 4 ? 'High' : Math.abs(priceMomentum) >= 2 ? 'Medium' : 'Low';
    const formatSigned = (value) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    const recommendationSegments = [
        { key: 'strongSell', value: strongSell, color: '#ef4444' },
        { key: 'sell', value: sell, color: '#f87171' },
        { key: 'hold', value: hold, color: '#94a3b8' },
        { key: 'buy', value: buy, color: '#34d399' },
        { key: 'strongBuy', value: strongBuy, color: '#10b981' },
    ];
    const recommendationSum = recommendationSegments.reduce((sum, segment) => sum + segment.value, 0);

    return (
        <div className="order-panel">
            <div className="order-panel-header">
                <div>
                    <div className="order-symbol">{symbol}</div>
                    <div className={`order-price ${(quote?.dp ?? 0) >= 0 ? 'price-up' : 'price-down'}`}>
                        ${price.toFixed(2)}
                        <span
                            className="order-change"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.18rem 0.5rem',
                                borderRadius: '999px',
                                marginLeft: '0.5rem',
                                background: (quote?.dp ?? 0) >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                border: `1px solid ${(quote?.dp ?? 0) >= 0 ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
                                color: (quote?.dp ?? 0) >= 0 ? '#10b981' : '#ef4444'
                            }}
                        >
                            <span aria-hidden="true">{(quote?.dp ?? 0) >= 0 ? '▲' : '▼'}</span>
                            {' '}({(quote?.dp ?? 0).toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Portfolio Status Badge ── */}
            {holding?.inPortfolio && (
                <div style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                        📦 In Portfolio
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {holding.quantity} shares @ ${holding.avgBuyPrice?.toFixed(2)}
                    </span>
                </div>
            )}

            <div className="analysis-grid-2">
                <div className="analysis-chip">
                    <span>AI Signal</span>
                    <strong
                        className={aiClass}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            width: 'fit-content',
                            padding: '0.22rem 0.5rem',
                            borderRadius: '999px',
                            background: aiBg,
                            border: `1px solid ${aiBorder}`,
                            color: aiText,
                        }}
                    >
                        <span aria-hidden="true">{aiIcon}</span>
                        {aiSignal}
                    </strong>
                </div>
                <div className="analysis-chip">
                    <span>Confidence</span>
                    <strong>{confidence}%</strong>
                </div>
            </div>

            <p style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic', color: '#94a3b8', margin: '8px 0 12px' }}>
                AI predictions are for informational purposes only and do not constitute financial advice. Always do your own research.
            </p>

            <div className="order-section">
                <div className="order-section-label">Analyst Recommendation</div>
                <div className="analysis-rec-bar" aria-label="Analyst recommendation distribution">
                    {recommendationSegments.map((segment) => (
                        <div
                            key={segment.key}
                            className="analysis-rec-bar-segment"
                            style={{
                                width: recommendationSum > 0 ? `${(segment.value / recommendationSum) * 100}%` : '0%',
                                background: segment.color,
                            }}
                            title={`${segment.key}: ${segment.value}`}
                        />
                    ))}
                </div>
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

            {/* ── Action Buttons ── */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                    className={`watchlist-action-btn ${inWatchlist ? 'in-watchlist' : ''}`}
                    onClick={toggleWatchlist}
                    disabled={watchlistLoading}
                    style={{ flex: 1, padding: '12px 0' }}
                >
                    {watchlistLoading ? '...' : inWatchlist ? 'In Watchlist' : 'Watch'}
                </button>
                <button
                    className="watchlist-action-btn"
                    onClick={onInvestClick}
                    style={{ flex: 1, padding: '12px 0', background: 'var(--primary-color, #3b82f6)', color: 'white', border: 'none' }}
                >
                    + Add to Portfolio
                </button>
                {holding?.inPortfolio && (
                    <button
                        className="watchlist-action-btn"
                        onClick={onSellClick}
                        style={{ flex: 1, padding: '12px 0', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        Record Sale
                    </button>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// BUY Modal
// --------------------------------------------------------------------------
function BuyModal({ symbol, quote, profile, onClose, onSuccess }) {
    const [form, setForm] = useState({ quantity: '', buyPrice: (quote?.c ?? '').toString(), date: '' });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const total = (Number(form.quantity) || 0) * (Number(form.buyPrice) || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.quantity || !form.buyPrice) return;
        setLoading(true);
        setErr('');
        try {
            await transactionService.buy(
                symbol,
                profile?.name || symbol,
                form.quantity,
                form.buyPrice,
                profile?.finnhubIndustry || 'Other'
            );
            onSuccess('buy');
        } catch (er) {
            setErr(er.message || 'Failed to buy stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}>
            <div className="bg-glass-card p-4" style={{ width: '400px', maxWidth: '95vw', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="text-white fw-bold mb-0">Log Investment</h5>
                    <button className="btn btn-sm text-muted" onClick={onClose} style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</button>
                </div>

                {/* Stock info strip */}
                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="rounded-circle bg-primary-subtle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <span className="text-primary fw-bold">{symbol ? symbol.charAt(0) : ''}</span>
                    </div>
                    <div>
                        <h6 className="text-white mb-0 fw-bold">{symbol}</h6>
                        <span className="text-muted small">CMP: ${(quote?.c ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="ms-auto text-end">
                        <span className={`small fw-bold ${(quote?.dp ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {(quote?.dp ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(quote?.dp ?? 0).toFixed(2)}%
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <div className="col-6">
                            <label className="text-muted small mb-1">Buy Price ($) *</label>
                            <input
                                type="number"
                                className="form-control bg-dark text-white border-secondary"
                                placeholder="e.g. 150.00"
                                min="0" step="any"
                                value={form.buyPrice}
                                onChange={e => setForm(p => ({ ...p, buyPrice: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="col-6">
                            <label className="text-muted small mb-1">Quantity *</label>
                            <input
                                type="number"
                                className="form-control bg-dark text-white border-secondary"
                                placeholder="e.g. 10"
                                min="0.0001" step="any"
                                value={form.quantity}
                                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="text-muted small mb-1">Date (optional)</label>
                        <input
                            type="date"
                            className="form-control bg-dark text-white border-secondary"
                            value={form.date}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        />
                    </div>

                    {/* Total preview */}
                    {total > 0 && (
                        <div className="d-flex justify-content-between align-items-center mb-3 px-3 py-2 rounded" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                            <span className="text-muted small">Total Investment</span>
                            <span className="text-white fw-bold">${total.toFixed(2)}</span>
                        </div>
                    )}

                    {err && <div className="alert alert-danger py-2 small mb-3">{err}</div>}

                    <button type="submit" className="btn btn-primary w-100 mt-1" disabled={loading}>
                        {loading ? 'Processing...' : 'Log Investment'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// SELL Modal (Stock Search page)
// --------------------------------------------------------------------------
function SellModal({ symbol, quote, holding, onClose, onSuccess }) {
    const [form, setForm] = useState({ quantity: '', sellPrice: (quote?.c ?? '').toString() });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const maxQty = holding?.quantity ?? 0;
    const total = (Number(form.quantity) || 0) * (Number(form.sellPrice) || 0);
    const buyTotal = (Number(form.quantity) || 0) * (holding?.avgBuyPrice ?? 0);
    const pnl = total - buyTotal;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.quantity || !form.sellPrice) return;
        if (Number(form.quantity) > maxQty) {
            setErr(`Insufficient quantity. You hold ${maxQty} shares.`);
            return;
        }
        setLoading(true);
        setErr('');
        try {
            await transactionService.sell(symbol, form.quantity, form.sellPrice);
            onSuccess('sell');
        } catch (er) {
            setErr(er.message || 'Failed to sell stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}>
            <div className="bg-glass-card p-4" style={{ width: '400px', maxWidth: '95vw', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="text-white fw-bold mb-0">Record Sale</h5>
                    <button className="btn btn-sm text-muted" onClick={onClose} style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</button>
                </div>

                {/* Current holding info */}
                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <div>
                        <div className="text-white fw-bold small">{symbol}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Holdings: <span className="text-white">{maxQty} shares</span> @ avg ${(holding?.avgBuyPrice ?? 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="ms-auto text-end">
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Market Price</div>
                        <div className="text-white fw-bold">${(quote?.c ?? 0).toFixed(2)}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <div className="col-6">
                            <label className="text-muted small mb-1">Sell Price ($) *</label>
                            <input
                                type="number"
                                className="form-control bg-dark text-white border-secondary"
                                min="0" step="any"
                                value={form.sellPrice}
                                onChange={e => setForm(p => ({ ...p, sellPrice: e.target.value }))}
                                required
                            />
                            <small className="text-muted" style={{ fontSize: '0.65rem' }}>Auto-filled with CMP</small>
                        </div>
                        <div className="col-6">
                            <label className="text-muted small mb-1">Quantity *</label>
                            <input
                                type="number"
                                className="form-control bg-dark text-white border-secondary"
                                placeholder={`Max ${maxQty}`}
                                min="0.0001" step="any"
                                max={maxQty}
                                value={form.quantity}
                                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                                required
                            />
                            <small className="text-muted" style={{ fontSize: '0.65rem' }}>Available: {maxQty}</small>
                        </div>
                    </div>

                    {/* P&L Preview */}
                    {Number(form.quantity) > 0 && (
                        <div className="mb-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted small">Sell Value</span>
                                <span className="text-white small fw-bold">${total.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted small">Buy Cost</span>
                                <span className="text-white small">${buyTotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '4px' }}>
                                <span className="text-muted small">Est. P&L</span>
                                <span className={`small fw-bold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {err && <div className="alert alert-danger py-2 small mb-3">{err}</div>}

                    <button type="submit" className="btn w-100 mt-1" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} disabled={loading}>
                        {loading ? 'Processing...' : 'Record Sale'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
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
    const [lastUpdated, setLastUpdated] = useState(null);

    // Portfolio holding state
    const [holding, setHolding] = useState({ inPortfolio: false, quantity: 0, avgBuyPrice: 0, currentPrice: 0 });

    // Modal state
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);

    const loadHolding = async () => {
        if (!authService.isAuthenticated()) return;
        try {
            const h = await transactionService.getHolding(symbol);
            setHolding(h);
        } catch { /* silent */ }
    };

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
                setLastUpdated(new Date());
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

    // Load holding status when page loads
    useEffect(() => {
        loadHolding();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    const toggleWatchlist = async () => {
        if (!authService.isAuthenticated()) {
            window.alert("Please login to manage your watchlist.");
            return;
        }
        const loadingId = toast.loading('Saving...');
        try {
            setWatchlistLoading(true);
            if (inWatchlist) {
                await watchlistService.removeFromWatchlist(symbol);
                setInWatchlist(false);
                toast.success(`${symbol} removed from watchlist`, { id: loadingId });
            } else {
                await watchlistService.addToWatchlist(symbol, profile?.name || symbol, 'stock');
                setInWatchlist(true);
                toast.success(`${symbol} added to watchlist`, { id: loadingId });
            }
        } catch (err) {
            const message = err.message || "Failed to update watchlist.";
            if (message.toLowerCase().includes('already')) {
                toast.error(`${symbol} is already in your watchlist`, { id: loadingId });
            } else {
                toast.error('Something went wrong. Please try again.', { id: loadingId });
            }
            window.alert(err.message || "Failed to update watchlist.");
        } finally {
            setWatchlistLoading(false);
        }
    };

    // Called after buy/sell modal success
    const handleTransactionSuccess = (type) => {
        setShowBuyModal(false);
        setShowSellModal(false);
        if (type === 'buy') toast.success('Investment logged successfully');
        else toast.success('Sale recorded successfully');
        // Refresh holding status
        setTimeout(loadHolding, 500);
    };

    const handleInvestClick = () => {
        if (!authService.isAuthenticated()) {
            window.alert("Please login to manage your portfolio.");
            return;
        }
        setShowBuyModal(true);
    };

    const handleSellClick = () => {
        if (!authService.isAuthenticated()) {
            window.alert("Please login to manage your portfolio.");
            return;
        }
        setShowSellModal(true);
    };

    const isPos = (quote?.dp ?? 0) >= 0;
    const formatLocalTimestamp = (timestamp) => {
        if (!timestamp) return '';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
        }).format(timestamp);
    };

    return (
        <div className="stock-search-page">
            <div className="stock-nav-actions">
                <button
                    type="button"
                    className="btn-glass stock-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>

            <div className="stock-main-layout">

                {/* ── LEFT: Chart + Stats ── */}
                <div className="stock-chart-col">
                    <div className="stock-chart-card">
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

                        <div className="scard-price-row">
                            <div>
                                <div className="scard-price">
                                    ${(quote?.c ?? 0).toFixed(2)}
                                    <span className={`scard-change ${isPos ? 'price-up' : 'price-down'}`}>
                                        {' '}{isPos ? '' : ''}{(quote?.d ?? 0).toFixed(2)} ({isPos ? '' : ''}{(quote?.dp ?? 0).toFixed(2)}%)
                                    </span>
                                </div>
                                <div className="scard-timestamp">
                                    {formatLocalTimestamp(lastUpdated || new Date())}
                                    <span className="market-open-badge">OPEN</span>
                                </div>
                            </div>
                        </div>

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

                        <StockStatsBar quote={quote} candles={candles} metrics={metrics} />
                    </div>

                    <div className="stock-chart-card mt-3">
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        <Technical_Analysis symbol={symbol} quote={quote} candles={candles} />
                    </div>

                    <p style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic', color: '#94a3b8', margin: '10px 4px 0' }}>
                        Technical analysis indicators are educational tools only. Past performance does not guarantee future results.
                    </p>
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
                        onInvestClick={handleInvestClick}
                        onSellClick={handleSellClick}
                        holding={holding}
                    />
                </div>
            </div>

            {/* ── Buy Modal ── */}
            {showBuyModal && (
                <BuyModal
                    symbol={symbol}
                    quote={quote}
                    profile={profile}
                    onClose={() => setShowBuyModal(false)}
                    onSuccess={handleTransactionSuccess}
                />
            )}

            {/* ── Sell Modal ── */}
            {showSellModal && holding?.inPortfolio && (
                <SellModal
                    symbol={symbol}
                    quote={quote}
                    holding={holding}
                    onClose={() => setShowSellModal(false)}
                    onSuccess={handleTransactionSuccess}
                />
            )}

            <Footer />
        </div>
    );
}

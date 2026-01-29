import React, { useState, useEffect, useCallback } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function StockDetailsPanel({ symbol, profile, quote, candles }) {
    // --------------------------------------------------------------------------
    // STATE: Investment & Watchlist
    // --------------------------------------------------------------------------
    const [isInvested, setIsInvested] = useState(() => {
        const saved = localStorage.getItem(`invested_${symbol}`);
        return saved === 'true';
    });

    const [investment, setInvestment] = useState(() => {
        const saved = localStorage.getItem(`investment_${symbol}`);
        return saved ? JSON.parse(saved) : { shares: '', buyPrice: '' };
    });

    const [inWatchlist, setInWatchlist] = useState(() => {
        const saved = localStorage.getItem('watchlist');
        if (saved) {
            const list = JSON.parse(saved);
            return list.some(item => item.symbol === symbol);
        }
        return false;
    });

    const [showInvestForm, setShowInvestForm] = useState(false);

    // --------------------------------------------------------------------------
    // STATE: AI Insights
    // --------------------------------------------------------------------------
    const [insight, setInsight] = useState(null);
    const [loadingInsight, setLoadingInsight] = useState(false);

    // --------------------------------------------------------------------------
    // EFFECTS
    // --------------------------------------------------------------------------
    useEffect(() => {
        localStorage.setItem(`invested_${symbol}`, isInvested);
        if (investment.shares && investment.buyPrice) {
            localStorage.setItem(`investment_${symbol}`, JSON.stringify(investment));
        }
    }, [isInvested, investment, symbol]);

    // Auto-generate AI insight on mount if data exists
    useEffect(() => {
        if (!insight && candles?.c?.length > 20) {
            generateInsight();
        }
    }, [candles]); // eslint-disable-line react-hooks/exhaustive-deps

    // --------------------------------------------------------------------------
    // HANDLERS: Investment
    // --------------------------------------------------------------------------
    const toggleWatchlist = () => {
        const saved = localStorage.getItem('watchlist');
        let list = saved ? JSON.parse(saved) : [];

        if (inWatchlist) {
            list = list.filter(item => item.symbol !== symbol);
        } else {
            list.push({ symbol, name: profile?.name || symbol, type: 'stock' });
        }

        localStorage.setItem('watchlist', JSON.stringify(list));
        setInWatchlist(!inWatchlist);
    };

    const handleInvest = () => {
        if (isInvested) return; // Already invested, maybe scroll to holdings?
        setShowInvestForm(!showInvestForm);
    };

    const handleSubmitInvestment = (e) => {
        e.preventDefault();
        if (investment.shares && investment.buyPrice) {
            setIsInvested(true);
            setShowInvestForm(false);
        }
    };

    // --------------------------------------------------------------------------
    // LOGIC: AI Insights Generation (Ported from AI_Market_Insight.js)
    // --------------------------------------------------------------------------
    const generateInsight = useCallback(() => {
        if (!candles || !candles.c || candles.c.length < 20) return;

        setLoadingInsight(true);
        // Simulate processing for realism
        setTimeout(() => {
            const prices = candles.c;
            const currentPrice = quote?.c || prices[prices.length - 1];

            // Simple SMA calc
            const calcSMA = (data, period) => {
                if (data.length < period) return null;
                return data.slice(-period).reduce((a, b) => a + b, 0) / period;
            };

            // Simple RSI calc
            const calcRSI = (data, period = 14) => {
                if (data.length < period + 1) return 50;
                let gains = 0, losses = 0;
                for (let i = data.length - period; i < data.length; i++) {
                    const change = data[i] - data[i - 1];
                    if (change > 0) gains += change;
                    else losses -= change;
                }
                const avgGain = gains / period;
                const avgLoss = losses / period;
                if (avgLoss === 0) return 100;
                return 100 - (100 / (1 + (avgGain / avgLoss)));
            };

            const sma20 = calcSMA(prices, 20);
            const sma50 = calcSMA(prices, 50);
            const rsi = calcRSI(prices);

            let score = 0;
            const reasons = [];

            if (sma20 && currentPrice > sma20) { score += 1; reasons.push('Price > 20-day SMA (Short-term Bullish)'); }
            else { score -= 1; reasons.push('Price < 20-day SMA (Short-term Bearish)'); }

            if (sma50 && currentPrice > sma50) { score += 1; reasons.push('Price > 50-day SMA (Mid-term Bullish)'); }

            if (rsi > 70) { score -= 1; reasons.push(`RSI ${rsi.toFixed(0)} (Overbought)`); }
            else if (rsi < 30) { score += 1; reasons.push(`RSI ${rsi.toFixed(0)} (Oversold)`); }

            let bias = 'Neutral', confidence = 'Medium';
            if (score >= 2) { bias = 'Bullish'; confidence = 'High'; }
            else if (score > 0) { bias = 'Bullish'; confidence = 'Low'; }
            else if (score <= -2) { bias = 'Bearish'; confidence = 'High'; }
            else if (score < 0) { bias = 'Bearish'; confidence = 'Low'; }

            setInsight({ bias, confidence, reasons, generatedAt: new Date().toLocaleTimeString() });
            setLoadingInsight(false);
        }, 800);
    }, [candles, quote]);

    // --------------------------------------------------------------------------
    // RENDER HELPERS
    // --------------------------------------------------------------------------
    const formatMarketCap = (mCap) => {
        if (!mCap) return "---";
        const billions = mCap / 1000;
        return `$${billions.toFixed(2)}B`;
    };

    const formatVolume = (vol) => {
        if (!vol) return "---";
        if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
        if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
        return vol.toString();
    };

    // Data for Charts
    const pieData = {
        labels: ['Buy', 'Hold', 'Sell'],
        datasets: [{
            data: [12, 5, 3], // Simulated
            backgroundColor: ['#10b981', '#94a3b8', '#ef4444'],
            borderWidth: 0,
        }],
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } }, // Minimal
    };

    // Derived Values
    const currentPrice = quote?.c || 0;
    const priceChange = quote?.d || 0;
    const priceChangePercent = quote?.dp || 0;
    const isPositive = priceChange >= 0;
    const dayLow = quote?.l || 0;
    const dayHigh = quote?.h || 0;
    const rangePercent = dayHigh > dayLow ? ((currentPrice - dayLow) / (dayHigh - dayLow)) * 100 : 50;

    const totalInvestment = investment.shares && investment.buyPrice
        ? (Number(investment.shares) * Number(investment.buyPrice)).toFixed(2)
        : null;

    if (!quote || !profile) return <div className="p-4 text-muted text-center">Loading Data...</div>;

    return (
        <div className="bg-glass rounded-lg d-flex flex-column h-100 overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 100px)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* ----------------------------------------------------------------
               1. STOCK SUMMARY (Fixed Top)
               ---------------------------------------------------------------- */}
            <div className="p-4 border-bottom border-light-10 bg-glass-dark sticky-top" style={{ zIndex: 10 }}>
                {/* Header Row */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h2 className="h4 fw-bold mb-0 text-white">{symbol}</h2>
                        <span className="text-muted text-xs text-uppercase">{profile.name}</span>
                    </div>
                    <span className="badge rounded-pill bg-success-soft text-success text-xxs">
                        ● MARKET OPEN
                    </span>
                </div>

                {/* Price Row */}
                <div className="d-flex align-items-baseline gap-3 mb-3">
                    <h1 className="display-6 fw-bold text-white mb-0">${currentPrice.toFixed(2)}</h1>
                    <span className={`fw-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                    </span>
                </div>

                {/* Day Range */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between text-muted text-xxs mb-1">
                        <span>L: ${dayLow.toFixed(2)}</span>
                        <span>Day's Range</span>
                        <span>H: ${dayHigh.toFixed(2)}</span>
                    </div>
                    <div className="progress" style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                        <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                                width: `${rangePercent}%`,
                                background: 'linear-gradient(90deg, #10b981, #3b82f6)'
                            }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2 d-md-flex">
                    <button
                        className={`btn btn-sm flex-grow-1 ${inWatchlist ? 'btn-glass text-primary border-primary' : 'btn-glass'}`}
                        onClick={toggleWatchlist}
                    >
                        {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
                    </button>
                    <button
                        className="btn btn-sm btn-accent flex-grow-1"
                        onClick={handleInvest}
                    >
                        {isInvested ? 'Update Position' : 'Invest'}
                    </button>
                </div>
            </div>

            {/* ----------------------------------------------------------------
               SCROLLABLE CONTENT AREA
               ---------------------------------------------------------------- */}
            <div className="flex-grow-1 overflow-auto custom-scrollbar p-4">

                {/* 3. INVESTMENT ACTION (Conditional Expand) */}
                {showInvestForm && (
                    <div className="mb-4 p-3 rounded-3 bg-primary-soft border border-primary-subtle fade-in">
                        <h6 className="text-xs text-uppercase fw-bold text-primary mb-3">Make Investment</h6>
                        <form onSubmit={handleSubmitInvestment}>
                            <div className="row g-2 mb-2">
                                <div className="col-6">
                                    <label className="text-xxs text-muted">Quantity</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm bg-glass text-white border-0"
                                        value={investment.shares}
                                        onChange={e => setInvestment({ ...investment, shares: e.target.value })}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="text-xxs text-muted">Price</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm bg-glass text-white border-0"
                                        value={investment.buyPrice || currentPrice}
                                        onChange={e => setInvestment({ ...investment, buyPrice: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <span className="text-xs text-muted">Est. Total: <span className="text-white fw-bold">${(investment.shares * (investment.buyPrice || currentPrice)).toFixed(2)}</span></span>
                                <button type="submit" className="btn btn-xs btn-primary px-3">Confirm Buy</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 4. YOUR HOLDINGS */}
                {isInvested && (
                    <div className="mb-4">
                        <h6 className="text-xs text-uppercase fw-bold text-muted mb-3 letter-spacing-wide">Your Position</h6>
                        <div className="p-3 rounded-3 bg-glass border border-light-5">
                            <div className="row text-center g-2">
                                <div className="col-4 border-end border-light-5">
                                    <span className="d-block text-xxs text-muted">Shares</span>
                                    <span className="d-block text-sm fw-bold text-white">{investment.shares}</span>
                                </div>
                                <div className="col-4 border-end border-light-5">
                                    <span className="d-block text-xxs text-muted">Avg Price</span>
                                    <span className="d-block text-sm fw-bold text-white">${investment.buyPrice}</span>
                                </div>
                                <div className="col-4">
                                    <span className="d-block text-xxs text-muted">Value</span>
                                    <span className="d-block text-sm fw-bold text-white">
                                        ${(Number(investment.shares) * currentPrice).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            {/* P/L Bar */}
                            {(() => {
                                const marketVal = Number(investment.shares) * currentPrice;
                                const costVal = Number(investment.shares) * Number(investment.buyPrice);
                                const pl = marketVal - costVal;
                                const isProf = pl >= 0;
                                return (
                                    <div className={`mt-3 pt-2 border-top border-light-5 text-center ${isProf ? 'text-success' : 'text-danger'}`}>
                                        <span className="text-xs fw-bold">
                                            {isProf ? '+' : ''}${pl.toFixed(2)} ({((pl / costVal) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* 2. QUICK METRICS */}
                <div className="mb-4">
                    <h6 className="text-xs text-uppercase fw-bold text-muted mb-3 letter-spacing-wide">Fundamentals</h6>
                    <div className="row g-2">
                        {[
                            { label: "Market Cap", val: formatMarketCap(profile.marketCapitalization) },
                            { label: "Volume", val: formatVolume(quote.v) },
                            { label: "P/E Ratio", val: "24.5x" }, // Simulated
                            { label: "Div Yield", val: "1.2%" },  // Simulated
                            { label: "52W High", val: "---" },
                            { label: "52W Low", val: "---" }
                        ].map((m, i) => (
                            <div className="col-6" key={i}>
                                <div className="p-2 rounded bg-glass-hover">
                                    <span className="d-block text-xxs text-muted mb-1">{m.label}</span>
                                    <span className="d-block text-sm fw-medium text-white">{m.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. ANALYST / AI RECOMMENDATION */}
                <div className="mb-4">
                    <h6 className="text-xs text-uppercase fw-bold text-muted mb-2 d-flex justify-content-between">
                        <span>AI Analysis</span>
                        <span className="badge bg-purple-soft text-purple text-xxs">BETA</span>
                    </h6>

                    {loadingInsight ? (
                        <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-secondary"></span></div>
                    ) : insight ? (
                        <div className="p-3 rounded-3 border"
                            style={{
                                borderColor: insight.bias === 'Bullish' ? '#10b98140' : insight.bias === 'Bearish' ? '#ef444440' : '#ffffff40',
                                background: insight.bias === 'Bullish' ? '#10b98110' : insight.bias === 'Bearish' ? '#ef444410' : '#ffffff05'
                            }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className={`fw-bold ${insight.bias === 'Bullish' ? 'text-success' : insight.bias === 'Bearish' ? 'text-danger' : 'text-white'}`}>
                                    {insight.bias.toUpperCase()}
                                </span>
                                <span className="text-xxs text-muted">{insight.confidence} Conf.</span>
                            </div>
                            <ul className="mb-0 ps-3 text-xs text-muted">
                                {insight.reasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center text-muted text-xs">No analysis available</div>
                    )}
                </div>

                {/* 5. COMMUNITY INSIGHTS */}
                <div className="mb-4">
                    <h6 className="text-xs text-uppercase fw-bold text-muted mb-3 letter-spacing-wide">Community Sentiment</h6>
                    <div className="d-flex align-items-center gap-3">
                        <div style={{ width: '80px', height: '80px' }}>
                            <Pie data={pieData} options={chartOptions} />
                        </div>
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between text-xs mb-1">
                                <span className="text-success">Buy (60%)</span>
                                <span className="text-muted">Hold (25%)</span>
                            </div>
                            <div className="progress" style={{ height: '6px' }}>
                                <div className="progress-bar bg-success" style={{ width: '60%' }}></div>
                                <div className="progress-bar bg-secondary" style={{ width: '25%' }}></div>
                                <div className="progress-bar bg-danger" style={{ width: '15%' }}></div>
                            </div>
                            <p className="text-xxs text-muted mt-2 mb-0">Based on 2.4k analysts</p>
                        </div>
                    </div>
                </div>

                {/* 8. DISCLAIMER */}
                <div className="mt-auto pt-4 border-top border-light-5">
                    <p className="text-xxs text-muted text-center mb-0 opacity-50">
                        Data provided for educational purposes. Market data may be delayed. Not financial advice.
                    </p>
                </div>

            </div>
        </div>
    );
}

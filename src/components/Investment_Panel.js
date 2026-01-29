import React, { useState, useEffect } from 'react';

export default function Investment_Panel({ symbol, profile, quote }) {
    // Investment state
    const [isInvested, setIsInvested] = useState(() => {
        const saved = localStorage.getItem(`invested_${symbol}`);
        return saved === 'true';
    });

    const [investment, setInvestment] = useState(() => {
        const saved = localStorage.getItem(`investment_${symbol}`);
        return saved ? JSON.parse(saved) : { shares: '', buyPrice: '' };
    });

    const [showInvestForm, setShowInvestForm] = useState(false);

    // Watchlist state
    const [inWatchlist, setInWatchlist] = useState(() => {
        const saved = localStorage.getItem('watchlist');
        if (saved) {
            const list = JSON.parse(saved);
            return list.some(item => item.symbol === symbol);
        }
        return false;
    });

    // Persist investment
    useEffect(() => {
        localStorage.setItem(`invested_${symbol}`, isInvested);
        if (investment.shares && investment.buyPrice) {
            localStorage.setItem(`investment_${symbol}`, JSON.stringify(investment));
        }
    }, [isInvested, investment, symbol]);

    // Toggle watchlist
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

    // Handle invest
    const handleInvest = () => {
        if (isInvested) {
            // Already invested, show details
            return;
        }
        setShowInvestForm(true);
    };

    const handleSubmitInvestment = (e) => {
        e.preventDefault();
        if (investment.shares && investment.buyPrice) {
            setIsInvested(true);
            setShowInvestForm(false);
        }
    };

    // Format helpers
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

    const currentPrice = quote?.c || 0;
    const priceChange = quote?.d || 0;
    const priceChangePercent = quote?.dp || 0;
    const isPositive = priceChange >= 0;
    const dayLow = quote?.l || 0;
    const dayHigh = quote?.h || 0;
    const prevClose = quote?.pc || 0;
    const openPrice = quote?.o || 0;

    // Day's range percentage for the indicator
    const rangePercent = dayHigh > dayLow ? ((currentPrice - dayLow) / (dayHigh - dayLow)) * 100 : 50;

    const totalInvestment = investment.shares && investment.buyPrice
        ? (Number(investment.shares) * Number(investment.buyPrice)).toFixed(2)
        : null;

    return (
        <div className="d-flex flex-column h-100">
            {/* Stock Header */}
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h4 className="mb-0 text-white fw-bold" style={{ fontSize: '1.5rem' }}>{symbol}</h4>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>{profile?.name || 'Loading...'}</p>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>{profile?.exchange || '---'}</span>
                        <span className="badge rounded-pill" style={{
                            fontSize: '0.55rem',
                            padding: '2px 6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981'
                        }}>
                            ● Market Open
                        </span>
                    </div>
                </div>
                <div className="text-end">
                    <h4 className="mb-0 text-white fw-bold" style={{ fontSize: '1.5rem' }}>
                        ${currentPrice.toFixed(2)}
                    </h4>
                    <span className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: '0.8rem' }}>
                        {isPositive ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                    </span>
                </div>
            </div>

            {/* Day's Range */}
            <div className="mb-3">
                <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: '0.65rem' }}>
                    <span>L: ${dayLow.toFixed(2)}</span>
                    <span className="text-muted" style={{ fontSize: '0.6rem' }}>Day's Range</span>
                    <span>H: ${dayHigh.toFixed(2)}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${rangePercent}%`,
                        background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                        borderRadius: '2px'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        left: `${rangePercent}%`,
                        top: '-3px',
                        width: '8px',
                        height: '10px',
                        background: '#fff',
                        borderRadius: '2px',
                        transform: 'translateX(-50%)'
                    }}></div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mb-4">
                <button
                    className={`btn flex-grow-1 ${inWatchlist ? 'btn-glass' : 'btn-glass'}`}
                    onClick={toggleWatchlist}
                    style={{
                        fontSize: '0.75rem',
                        padding: '0.6rem',
                        border: inWatchlist ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                        color: inWatchlist ? '#3b82f6' : '#fff'
                    }}
                >
                    {inWatchlist ? '✓ Watchlist' : '+ Watchlist'}
                </button>
                <button
                    className="btn btn-accent flex-grow-1"
                    onClick={handleInvest}
                    style={{ fontSize: '0.75rem', padding: '0.6rem' }}
                >
                    {isInvested ? '✓ Invested' : 'Invest'}
                </button>
            </div>

            {/* Investment Form */}
            {showInvestForm && (
                <form onSubmit={handleSubmitInvestment} className="mb-4 p-3 rounded-3" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <h6 className="text-white mb-3" style={{ fontSize: '0.8rem' }}>Enter Investment Details</h6>
                    <div className="mb-2">
                        <input
                            type="number"
                            className="form-control bg-glass text-white border-0"
                            style={{ fontSize: '0.8rem' }}
                            placeholder="Number of shares"
                            value={investment.shares}
                            onChange={(e) => setInvestment({ ...investment, shares: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-2">
                        <input
                            type="number"
                            step="0.01"
                            className="form-control bg-glass text-white border-0"
                            style={{ fontSize: '0.8rem' }}
                            placeholder="Buy price per share ($)"
                            value={investment.buyPrice}
                            onChange={(e) => setInvestment({ ...investment, buyPrice: e.target.value })}
                            required
                        />
                    </div>
                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-accent btn-sm flex-grow-1">Confirm</button>
                        <button type="button" className="btn btn-glass btn-sm" onClick={() => setShowInvestForm(false)}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Key Statistics */}
            <div className="mb-4">
                <h6 className="text-muted text-uppercase mb-3" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Key Statistics
                </h6>
                <div style={{ fontSize: '0.75rem' }}>
                    <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted">Market Cap</span>
                        <span className="text-white fw-medium">{formatMarketCap(profile?.marketCapitalization)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted">Sector</span>
                        <span className="text-white fw-medium">{profile?.finnhubIndustry || '---'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted">P/E Ratio</span>
                        <span className="text-white fw-medium">---</span>
                    </div>
                    <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted">Volume</span>
                        <span className="text-white fw-medium">{formatVolume(quote?.v)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted">Prev Close</span>
                        <span className="text-white fw-medium">${prevClose.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted">Open</span>
                        <span className="text-white fw-medium">${openPrice.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted">52W High</span>
                        <span className="text-white fw-medium">---</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                        <span className="text-muted">52W Low</span>
                        <span className="text-white fw-medium">---</span>
                    </div>
                </div>
                <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.55rem', fontStyle: 'italic' }}>
                    * Estimated / Educational data
                </p>
            </div>

            {/* Your Holdings */}
            <div className="mb-3">
                <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Your Holdings
                </h6>

                {isInvested && totalInvestment ? (
                    <div className="p-3 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Shares</span>
                            <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>{investment.shares}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Avg Buy Price</span>
                            <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>${investment.buyPrice}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Total Investment</span>
                            <span className="text-white fw-bold" style={{ fontSize: '0.8rem' }}>${totalInvestment}</span>
                        </div>
                        {/* Unrealized P/L */}
                        {(() => {
                            const currentValue = Number(investment.shares) * currentPrice;
                            const investedValue = Number(totalInvestment);
                            const unrealizedPL = currentValue - investedValue;
                            const plPercent = investedValue > 0 ? ((unrealizedPL / investedValue) * 100).toFixed(2) : 0;
                            const isProfit = unrealizedPL >= 0;

                            return (
                                <div className="d-flex justify-content-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>Unrealized P/L</span>
                                    <span className={isProfit ? 'text-success' : 'text-danger'} style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                        {isProfit ? '+' : ''}${unrealizedPL.toFixed(2)} ({isProfit ? '+' : ''}{plPercent}%)
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>You haven't invested in this stock yet</span>
                    </div>
                )}
            </div>

            {/* Community Sentiment (Compact) */}
            <div className="mt-auto">
                <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Community Sentiment
                </h6>
                <div className="d-flex gap-1 mb-2" style={{ height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '55%', background: '#10b981' }} title="Buying"></div>
                    <div style={{ width: '30%', background: '#3b82f6' }} title="Holding"></div>
                    <div style={{ width: '15%', background: '#ef4444' }} title="Selling"></div>
                </div>
                <div className="d-flex justify-content-between" style={{ fontSize: '0.6rem' }}>
                    <span className="text-success">55% Buying</span>
                    <span className="text-primary">30% Holding</span>
                    <span className="text-danger">15% Selling</span>
                </div>
            </div>
        </div>
    );
}

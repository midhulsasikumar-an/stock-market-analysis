import React from 'react';

/**
 * Market Snapshot - Compact info bar above the chart
 */
export default function Market_Snapshot({ quote, profile }) {
    if (!quote) {
        return (
            <div className="d-flex align-items-center gap-4 py-2 px-3 mb-3 rounded-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Loading market data...</span>
            </div>
        );
    }

    const currentPrice = quote.c || 0;
    const priceChange = quote.d || 0;
    const priceChangePercent = quote.dp || 0;
    const isPositive = priceChange >= 0;
    const dayLow = quote.l || 0;
    const dayHigh = quote.h || 0;
    const volume = quote.v || 0;

    // Market status (simplified - based on time)
    const now = new Date();
    const hour = now.getUTCHours();
    const isMarketOpen = hour >= 14 && hour < 21; // ~9:30 AM - 4 PM ET in UTC

    const formatVolume = (vol) => {
        if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
        if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
        return vol.toString();
    };

    return (
        <div className="d-flex flex-wrap align-items-center gap-4 py-2 px-3 mb-3 rounded-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Price */}
            <div className="d-flex align-items-center gap-2">
                <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>${currentPrice.toFixed(2)}</span>
                <span className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: '0.75rem' }}>
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

            {/* Market Status */}
            <div className="d-flex align-items-center gap-1">
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isMarketOpen ? '#10b981' : '#94a3b8'
                }}></span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {isMarketOpen ? 'Market Open' : 'Market Closed'}
                </span>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

            {/* Day's Range */}
            <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '0.65rem' }}>Range:</span>
                <span className="text-white" style={{ fontSize: '0.7rem' }}>
                    ${dayLow.toFixed(2)} – ${dayHigh.toFixed(2)}
                </span>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

            {/* Volume */}
            <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '0.65rem' }}>Vol:</span>
                <span className="text-white" style={{ fontSize: '0.7rem' }}>{formatVolume(volume)}</span>
            </div>
        </div>
    );
}

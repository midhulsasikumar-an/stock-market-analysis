import React from 'react';

/**
 * Market Summary - Trend/Momentum/Volatility badges below the chart
 */
export default function Market_Summary({ quote, candles }) {
    // Calculate trend based on price data
    const calculateTrend = () => {
        if (!candles || !candles.c || candles.c.length < 5) return 'Neutral';
        const prices = candles.c;
        const recent = prices.slice(-5);
        const older = prices.slice(-10, -5);

        if (older.length === 0) return 'Neutral';

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (change > 2) return 'Bullish';
        if (change < -2) return 'Bearish';
        return 'Neutral';
    };

    // Calculate momentum based on recent price action
    const calculateMomentum = () => {
        if (!quote) return 'Moderate';
        const changePercent = Math.abs(quote.dp || 0);

        if (changePercent > 3) return 'Strong';
        if (changePercent > 1) return 'Moderate';
        return 'Weak';
    };

    // Calculate volatility based on day's range
    const calculateVolatility = () => {
        if (!quote) return 'Medium';
        const dayRange = (quote.h || 0) - (quote.l || 0);
        const avgPrice = quote.c || 1;
        const volatilityPercent = (dayRange / avgPrice) * 100;

        if (volatilityPercent > 3) return 'High';
        if (volatilityPercent > 1) return 'Medium';
        return 'Low';
    };

    const trend = calculateTrend();
    const momentum = calculateMomentum();
    const volatility = calculateVolatility();

    const getBadgeStyle = (type, value) => {
        let bgColor, textColor;

        switch (type) {
            case 'trend':
                if (value === 'Bullish') { bgColor = 'rgba(16, 185, 129, 0.15)'; textColor = '#10b981'; }
                else if (value === 'Bearish') { bgColor = 'rgba(239, 68, 68, 0.15)'; textColor = '#ef4444'; }
                else { bgColor = 'rgba(148, 163, 184, 0.15)'; textColor = '#94a3b8'; }
                break;
            case 'momentum':
                if (value === 'Strong') { bgColor = 'rgba(59, 130, 246, 0.15)'; textColor = '#3b82f6'; }
                else if (value === 'Weak') { bgColor = 'rgba(148, 163, 184, 0.15)'; textColor = '#94a3b8'; }
                else { bgColor = 'rgba(245, 158, 11, 0.15)'; textColor = '#f59e0b'; }
                break;
            case 'volatility':
                if (value === 'High') { bgColor = 'rgba(239, 68, 68, 0.15)'; textColor = '#ef4444'; }
                else if (value === 'Low') { bgColor = 'rgba(16, 185, 129, 0.15)'; textColor = '#10b981'; }
                else { bgColor = 'rgba(245, 158, 11, 0.15)'; textColor = '#f59e0b'; }
                break;
            default:
                bgColor = 'rgba(148, 163, 184, 0.15)';
                textColor = '#94a3b8';
        }

        return { background: bgColor, color: textColor };
    };

    return (
        <div className="d-flex align-items-center gap-4 py-2 px-3 mt-3 rounded-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Summary
            </span>

            {/* Trend */}
            <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Trend:</span>
                <span
                    className="badge rounded-pill"
                    style={{
                        fontSize: '0.65rem',
                        padding: '3px 8px',
                        ...getBadgeStyle('trend', trend)
                    }}
                >
                    {trend}
                </span>
            </div>

            {/* Momentum */}
            <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Momentum:</span>
                <span
                    className="badge rounded-pill"
                    style={{
                        fontSize: '0.65rem',
                        padding: '3px 8px',
                        ...getBadgeStyle('momentum', momentum)
                    }}
                >
                    {momentum}
                </span>
            </div>

            {/* Volatility */}
            <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Volatility:</span>
                <span
                    className="badge rounded-pill"
                    style={{
                        fontSize: '0.65rem',
                        padding: '3px 8px',
                        ...getBadgeStyle('volatility', volatility)
                    }}
                >
                    {volatility}
                </span>
            </div>
        </div>
    );
}

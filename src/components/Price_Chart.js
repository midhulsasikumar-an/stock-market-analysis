import React, { useState, useEffect, useCallback } from 'react';
import { fetchCandles } from '../services/finnhub';

const TIME_RANGES = [
    { label: '1D', days: 1, resolution: '5' },
    { label: '1W', days: 7, resolution: '60' },
    { label: '1M', days: 30, resolution: 'D' },
    { label: '6M', days: 180, resolution: 'D' },
    { label: '1Y', days: 365, resolution: 'W' },
];

/**
 * Price_Chart - Robust SVG-based stock chart with state management
 */
export default function Price_Chart({
    symbol,
    candles: initialCandles,
    compact = false,
    title,
    subtitle,
    badge,
    headerControls = false
}) {
    const [activeRange, setActiveRange] = useState('1M');
    // ... existing state ...
    const [candles, setCandles] = useState(initialCandles || null);
    const [status, setStatus] = useState(initialCandles ? 'success' : 'loading');
    const [lastAttemptedRange, setLastAttemptedRange] = useState(null);

    // ... Validation and LoadData ... (keeping logic same)
    const validateData = (data) => {
        if (!data || data.s === 'no_data' || !data.c || data.c.length === 0) return 'empty';
        return 'success';
    };

    const loadData = useCallback(async (rangeLabel, retryFallback = true) => {
        if (!symbol) return;
        setStatus('loading');
        const rangeConfig = TIME_RANGES.find(r => r.label === rangeLabel);
        try {
            const data = await fetchCandles(symbol, rangeConfig.resolution, rangeConfig.days);
            if (data && data.s === 'ok' && data.c && data.c.length > 2) {
                setCandles(data);
                setStatus('success');
            } else if (data && data.s === 'no_data' && retryFallback) {
                const currentIndex = TIME_RANGES.findIndex(r => r.label === rangeLabel);
                if (currentIndex < TIME_RANGES.length - 1) {
                    const nextRange = TIME_RANGES[currentIndex + 1].label;
                    setActiveRange(nextRange);
                    loadData(nextRange, true);
                    return;
                }
                setStatus('empty');
            } else {
                setStatus(data?.s === 'forbidden' ? 'restricted' : 'restricted');
            }
        } catch (err) {
            setStatus('error');
        }
    }, [symbol]);

    useEffect(() => {
        if (initialCandles) {
            const validation = validateData(initialCandles);
            setCandles(initialCandles);
            setStatus(validation);
        }
    }, [initialCandles]);

    useEffect(() => {
        if (!symbol || initialCandles) return;
        loadData(activeRange);
    }, [symbol, activeRange, initialCandles, loadData]);

    const getPoints = (prices) => {
        if (!prices || prices.length < 2) return "";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const width = 600;
        const height = 300;
        const stepX = width / (prices.length - 1);
        return prices.map((p, i) => {
            const x = i * stepX;
            const y = height - ((p - min) / range * (height - 50) + 25);
            return `${x},${y}`;
        }).join(' ');
    };

    const prices = candles?.c || [];
    const isPositive = prices.length > 0 && prices[prices.length - 1] >= prices[0];
    const chartColor = isPositive ? '#10b981' : '#ef4444';

    const renderTimeframes = () => (
        <div className={headerControls ? "price-chart-header-controls" : "d-flex gap-2 mt-2 px-1"}>
            {TIME_RANGES.map(range => (
                <button
                    key={range.label}
                    className={`btn-pill btn-glass btn-sm ${activeRange === range.label ? 'active' : ''}`}
                    onClick={() => setActiveRange(range.label)}
                    style={!headerControls ? { padding: '0.15rem 0.6rem', fontSize: '0.65rem' } : {}}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center opacity-75">
                        <div className="spinner-border spinner-border-sm text-primary mb-2 d-block mx-auto" role="status"></div>
                    </div>
                );
            case 'success':
                return (
                    <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="none" className="fadeIn">
                        <polyline
                            points={getPoints(prices)}
                            fill="none"
                            stroke={chartColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                );
            case 'empty':
            case 'restricted':
            case 'error':
            default:
                const msg = status === 'empty' ? 'Historical data unavailable' :
                    status === 'restricted' ? 'Restricted by API tier' : 'Service unavailable';
                return (
                    <div className="text-center opacity-50 px-4">
                        <p className="mb-0 text-sm">{msg}</p>
                    </div>
                );
        }
    };

    return (
        <div className={`Price_Chart h-100 d-flex flex-column ${compact ? "compact-mode" : "full-mode"}`}>
            {(title || headerControls) && (
                <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                    <div>
                        {title && <h5 className="fw-bold mb-0 text-white letter-spacing-wide text-uppercase">{title}</h5>}
                        {subtitle && <p className="text-muted text-xs mb-0 mt-1">{subtitle}</p>}
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        {badge && <span className="chart-badge-tier">{badge}</span>}
                        {headerControls && renderTimeframes()}
                    </div>
                </div>
            )}

            <div className={`chart-container-inner flex-grow-1 d-flex align-items-center justify-content-center ${compact ? 'compact-chart' : ''}`}
                style={{ minHeight: compact ? '160px' : '300px' }}>
                {renderContent()}
            </div>

            {!headerControls && renderTimeframes()}
        </div>
    );
}

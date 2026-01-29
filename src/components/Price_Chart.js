import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

    // Indicators State
    const [indicators, setIndicators] = useState({
        sma20: true,
        sma50: false,
        sma200: false,
        ema20: false,
        volume: true
    });

    const toggleIndicator = (name) => {
        setIndicators(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const [candles, setCandles] = useState(initialCandles || null);
    const [status, setStatus] = useState(initialCandles ? 'success' : 'loading');

    // ... LoadData Logic ...
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

    const prices = useMemo(() => candles?.c || [], [candles]);
    const volumes = useMemo(() => candles?.v || [], [candles]);

    // Calculate Indicators
    const calculatedIndicators = useMemo(() => {
        if (!prices.length) return {};

        const calculateSMA = (period) => {
            const sma = [];
            for (let i = 0; i < prices.length; i++) {
                if (i < period - 1) {
                    sma.push(null);
                    continue;
                }
                const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                sma.push(sum / period);
            }
            return sma;
        };

        const calculateEMA = (period) => {
            const k = 2 / (period + 1);
            let ema = prices[0];
            const result = [ema];
            for (let i = 1; i < prices.length; i++) {
                ema = prices[i] * k + ema * (1 - k);
                result.push(ema);
            }
            return result;
        };

        return {
            sma20: indicators.sma20 ? calculateSMA(20) : null,
            sma50: indicators.sma50 ? calculateSMA(50) : null,
            sma200: indicators.sma200 ? calculateSMA(200) : null,
            ema20: indicators.ema20 ? calculateEMA(20) : null,
        };
    }, [prices, indicators]);

    const getPoints = (data) => {
        if (!data || data.length < 2) return "";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const width = 600;
        const height = 300;
        const stepX = width / (data.length - 1);

        return data.map((p, i) => {
            if (p === null) return null;
            const x = i * stepX;
            // Handle scale relative to price range
            const y = height - ((p - min) / range * (height - 50) + 25);
            return `${x},${y}`;
        }).filter(Boolean).join(' ');
    };

    const getVolumePath = () => {
        if (!indicators.volume || !volumes.length) return "";
        const maxVol = Math.max(...volumes);
        const width = 600;
        const height = 300;
        const stepX = width / (volumes.length - 1);

        return volumes.map((v, i) => {
            const x = i * stepX;
            const h = (v / maxVol) * 100; // max 1/3 height
            const y = height - h;
            return `M ${x},${height} L ${x},${y}`;
        }).join(' ');
    };

    const isPositive = prices.length > 0 && prices[prices.length - 1] >= prices[0];
    const chartColor = isPositive ? '#10b981' : '#ef4444';

    const renderTimeframes = () => (
        <div className="d-flex flex-wrap gap-1 align-items-center ms-auto">
            {TIME_RANGES.map(range => (
                <button
                    key={range.label}
                    className={`btn-pill btn-glass btn-xs ${activeRange === range.label ? 'active bg-white-10 text-white' : 'text-muted hover-text-white'}`}
                    onClick={() => setActiveRange(range.label)}
                    style={{ padding: '2px 8px', fontSize: '0.6rem' }}
                >
                    {range.label}
                </button>
            ))}

            {/* Divider */}
            <div className="mx-2" style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>

            {/* Indicator Toggles */}
            <div className="d-flex gap-1">
                <button className={`btn-pill btn-glass btn-xs ${indicators.sma20 ? 'active' : ''}`} onClick={() => toggleIndicator('sma20')} style={{ fontSize: '0.6rem', padding: '2px 6px', color: indicators.sma20 ? '#fbbf24' : '' }}>SMA20</button>
                <button className={`btn-pill btn-glass btn-xs ${indicators.sma50 ? 'active' : ''}`} onClick={() => toggleIndicator('sma50')} style={{ fontSize: '0.6rem', padding: '2px 6px', color: indicators.sma50 ? '#60a5fa' : '' }}>SMA50</button>
                <button className={`btn-pill btn-glass btn-xs ${indicators.sma200 ? 'active' : ''}`} onClick={() => toggleIndicator('sma200')} style={{ fontSize: '0.6rem', padding: '2px 6px', color: indicators.sma200 ? '#e879f9' : '' }}>SMA200</button>
                <button className={`btn-pill btn-glass btn-xs ${indicators.ema20 ? 'active' : ''}`} onClick={() => toggleIndicator('ema20')} style={{ fontSize: '0.6rem', padding: '2px 6px', color: indicators.ema20 ? '#34d399' : '' }}>EMA20</button>
                <button className={`btn-pill btn-glass btn-xs ${indicators.volume ? 'active' : ''}`} onClick={() => toggleIndicator('volume')} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Vol</button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (status === 'loading') {
            return (
                <div className="text-center opacity-75">
                    <div className="spinner-border spinner-border-sm text-primary mb-2 d-block mx-auto" role="status"></div>
                </div>
            );
        }

        // Handle Restricted / Empty with Blur Overlay
        if (status !== 'success') {
            const isRestricted = status === 'restricted';
            const msg = status === 'empty' ? 'Historical data unavailable' :
                isRestricted ? 'Advanced chart data unavailable on current plan' : 'Service unavailable';

            return (
                <div className="position-relative w-100 h-100 overflow-hidden">
                    {/* Blurred Background (Simulated Chart) */}
                    <div className="w-100 h-100" style={{ filter: 'blur(8px)', opacity: 0.3, pointerEvents: 'none' }}>
                        <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="none">
                            <polyline
                                points="0,150 50,140 100,160 150,130 200,145 250,120 300,140 350,110 400,130 450,100 500,120 550,90 600,110"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    {/* Overlay Message */}
                    <div className="position-absolute top-50 start-50 translate-middle text-center p-4 rounded-3"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {isRestricted && <span className="mb-2 d-block text-xl">🔒</span>}
                        <p className="mb-0 text-sm fw-medium text-white">{msg}</p>
                        {isRestricted && <small className="text-xs text-muted mt-1 d-block">Upgrade to view realtime charts</small>}
                    </div>
                </div>
            );
        }

        return (
            <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="none" className="fadeIn">
                {/* Volume Overlay */}
                {indicators.volume && (
                    <path
                        d={getVolumePath()}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="4"
                        fill="none"
                        style={{ opacity: 0.5 }}
                    />
                )}

                {/* Main Price Line */}
                <polyline
                    points={getPoints(prices)}
                    fill="none"
                    stroke={chartColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Indicators */}
                {indicators.sma20 && calculatedIndicators.sma20 && (
                    <polyline points={getPoints(calculatedIndicators.sma20)} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.8" />
                )}
                {indicators.sma50 && calculatedIndicators.sma50 && (
                    <polyline points={getPoints(calculatedIndicators.sma50)} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.8" />
                )}
                {indicators.sma200 && calculatedIndicators.sma200 && (
                    <polyline points={getPoints(calculatedIndicators.sma200)} fill="none" stroke="#e879f9" strokeWidth="1.5" strokeOpacity="0.8" />
                )}
                {indicators.ema20 && calculatedIndicators.ema20 && (
                    <polyline points={getPoints(calculatedIndicators.ema20)} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4,4" strokeOpacity="0.8" />
                )}
            </svg>
        );
    };

    return (
        <div className={`Price_Chart h-100 d-flex flex-column ${compact ? "compact-mode" : "full-mode"}`}>

            {/* Header: Title + Controls */}
            <div className="d-flex justify-content-between align-items-center mb-3 px-2 border-bottom border-light-5 pb-2">
                <div>
                    {title && <h5 className="fw-bold mb-0 text-white letter-spacing-wide text-uppercase">{title}</h5>}
                    {subtitle && <p className="text-muted text-xs mb-0 mt-1">{subtitle}</p>}
                </div>

                {/* Timeframes & Controls moved to Header */}
                {!headerControls && renderTimeframes()}
            </div>

            <div className={`chart-container-inner flex-grow-1 d-flex align-items-center justify-content-center ${compact ? 'compact-chart' : ''}`}
                style={{ minHeight: compact ? '160px' : '300px' }}>
                {renderContent()}
            </div>

        </div>
    );
}

import React, { useMemo } from 'react';

/**
 * Indicator_Charts - RSI and MACD secondary charts
 */
export default function Indicator_Charts({ candles }) {
    // Calculate RSI
    const rsiData = useMemo(() => {
        if (!candles?.c || candles.c.length < 15) return null;

        const prices = candles.c;
        const rsiValues = [];
        const period = 14;

        for (let i = period; i < prices.length; i++) {
            let gains = 0, losses = 0;
            for (let j = i - period + 1; j <= i; j++) {
                const change = prices[j] - prices[j - 1];
                if (change > 0) gains += change;
                else losses -= change;
            }
            const avgGain = gains / period;
            const avgLoss = losses / period;
            const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
            rsiValues.push(rsi);
        }

        return rsiValues;
    }, [candles]);

    // Calculate MACD
    const macdData = useMemo(() => {
        if (!candles?.c || candles.c.length < 26) return null;

        const prices = candles.c;

        const calcEMA = (data, period) => {
            const k = 2 / (period + 1);
            const emaValues = [];
            let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
            emaValues.push(ema);
            for (let i = period; i < data.length; i++) {
                ema = data[i] * k + ema * (1 - k);
                emaValues.push(ema);
            }
            return emaValues;
        };

        const ema12 = calcEMA(prices, 12);
        const ema26 = calcEMA(prices, 26);

        const macdLine = [];
        const offset = 26 - 12;
        for (let i = 0; i < ema26.length; i++) {
            macdLine.push(ema12[i + offset] - ema26[i]);
        }

        // Signal line (9-period EMA of MACD)
        const signalLine = calcEMA(macdLine, 9);

        // Histogram
        const histogram = [];
        const signalOffset = macdLine.length - signalLine.length;
        for (let i = 0; i < signalLine.length; i++) {
            histogram.push(macdLine[i + signalOffset] - signalLine[i]);
        }

        return { macdLine: macdLine.slice(-20), signalLine: signalLine.slice(-20), histogram: histogram.slice(-20) };
    }, [candles]);

    // SVG dimensions
    const width = 100;
    const height = 60;
    const padding = 5;

    // Render RSI chart
    const renderRSI = () => {
        if (!rsiData || rsiData.length < 5) {
            return <span className="text-muted" style={{ fontSize: '0.7rem' }}>Insufficient data</span>;
        }

        const data = rsiData.slice(-30);
        const xStep = (width - padding * 2) / (data.length - 1);

        const toY = (val) => {
            return height - padding - ((val / 100) * (height - padding * 2));
        };

        const points = data.map((val, i) => `${padding + i * xStep},${toY(val)}`).join(' ');
        const currentRSI = data[data.length - 1];

        return (
            <div className="d-flex align-items-center gap-3">
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '120px', height: '50px' }}>
                    {/* Overbought line */}
                    <line x1={padding} y1={toY(70)} x2={width - padding} y2={toY(70)}
                        stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
                    {/* Oversold line */}
                    <line x1={padding} y1={toY(30)} x2={width - padding} y2={toY(30)}
                        stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
                    {/* RSI line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke={currentRSI > 70 ? '#ef4444' : currentRSI < 30 ? '#10b981' : '#8b5cf6'}
                        strokeWidth="1.5"
                    />
                </svg>
                <div>
                    <span
                        className="fw-bold"
                        style={{
                            fontSize: '1rem',
                            color: currentRSI > 70 ? '#ef4444' : currentRSI < 30 ? '#10b981' : '#8b5cf6'
                        }}
                    >
                        {currentRSI.toFixed(1)}
                    </span>
                    <span className="text-muted d-block" style={{ fontSize: '0.55rem' }}>
                        {currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral'}
                    </span>
                </div>
            </div>
        );
    };

    // Render MACD chart
    const renderMACD = () => {
        if (!macdData || macdData.histogram.length < 5) {
            return <span className="text-muted" style={{ fontSize: '0.7rem' }}>Insufficient data</span>;
        }

        const { histogram } = macdData;
        const max = Math.max(...histogram.map(Math.abs));
        const barWidth = (width - padding * 2) / histogram.length;

        const toY = (val) => {
            const centerY = height / 2;
            return centerY - (val / max) * (height / 2 - padding);
        };

        const currentMACD = histogram[histogram.length - 1];
        const macdTrend = currentMACD > histogram[histogram.length - 2] ? 'Increasing' : 'Decreasing';

        return (
            <div className="d-flex align-items-center gap-3">
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '120px', height: '50px' }}>
                    {/* Zero line */}
                    <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2}
                        stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    {/* Histogram bars */}
                    {histogram.map((val, i) => (
                        <rect
                            key={i}
                            x={padding + i * barWidth + 1}
                            y={val > 0 ? toY(val) : height / 2}
                            width={barWidth - 2}
                            height={Math.abs(toY(val) - height / 2)}
                            fill={val > 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'}
                        />
                    ))}
                </svg>
                <div>
                    <span
                        className="fw-bold"
                        style={{
                            fontSize: '1rem',
                            color: currentMACD > 0 ? '#10b981' : '#ef4444'
                        }}
                    >
                        {currentMACD > 0 ? '+' : ''}{currentMACD.toFixed(2)}
                    </span>
                    <span className="text-muted d-block" style={{ fontSize: '0.55rem' }}>
                        {macdTrend}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-glass rounded-lg p-md">
            <h6 className="text-muted text-uppercase mb-3" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                Technical Indicators
            </h6>

            <div className="row g-3">
                {/* RSI */}
                <div className="col-6">
                    <div className="p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <span className="text-muted d-block mb-2" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>
                            RSI (14)
                        </span>
                        {renderRSI()}
                    </div>
                </div>

                {/* MACD */}
                <div className="col-6">
                    <div className="p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <span className="text-muted d-block mb-2" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>
                            MACD Histogram
                        </span>
                        {renderMACD()}
                    </div>
                </div>
            </div>
        </div>
    );
}

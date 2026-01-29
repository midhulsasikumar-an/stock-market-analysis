import React, { useState, useEffect, useCallback } from 'react';

/**
 * AI Market Insight - AI-generated analytical outlook
 * Educational purposes only - NOT investment advice
 */
export default function AI_Market_Insight({ symbol, quote, candles, profile }) {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [lastRefresh, setLastRefresh] = useState(null);

    // Calculate technical indicators
    const calculateIndicators = useCallback(() => {
        if (!candles || !candles.c || candles.c.length < 20) {
            return null;
        }

        const prices = candles.c;
        const highs = candles.h;
        const lows = candles.l;
        const volumes = candles.v;

        // SMA calculations
        const calcSMA = (data, period) => {
            if (data.length < period) return null;
            const slice = data.slice(-period);
            return slice.reduce((a, b) => a + b, 0) / period;
        };

        // EMA calculation
        const calcEMA = (data, period) => {
            if (data.length < period) return null;
            const k = 2 / (period + 1);
            let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
            for (let i = period; i < data.length; i++) {
                ema = data[i] * k + ema * (1 - k);
            }
            return ema;
        };

        // RSI calculation
        const calcRSI = (data, period = 14) => {
            if (data.length < period + 1) return null;
            let gains = 0, losses = 0;
            for (let i = data.length - period; i < data.length; i++) {
                const change = data[i] - data[i - 1];
                if (change > 0) gains += change;
                else losses -= change;
            }
            const avgGain = gains / period;
            const avgLoss = losses / period;
            if (avgLoss === 0) return 100;
            const rs = avgGain / avgLoss;
            return 100 - (100 / (1 + rs));
        };

        // MACD calculation
        const calcMACD = (data) => {
            const ema12 = calcEMA(data, 12);
            const ema26 = calcEMA(data, 26);
            if (ema12 === null || ema26 === null) return null;
            return ema12 - ema26;
        };

        // Volume trend
        const calcVolumeTrend = (vols) => {
            if (vols.length < 10) return 'stable';
            const recent = vols.slice(-5).reduce((a, b) => a + b, 0) / 5;
            const older = vols.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
            const change = ((recent - older) / older) * 100;
            if (change > 20) return 'increasing';
            if (change < -20) return 'decreasing';
            return 'stable';
        };

        const currentPrice = quote?.c || prices[prices.length - 1];
        const sma20 = calcSMA(prices, 20);
        const sma50 = calcSMA(prices, 50);
        const sma200 = calcSMA(prices, Math.min(200, prices.length));
        const ema20 = calcEMA(prices, 20);
        const rsi = calcRSI(prices);
        const macd = calcMACD(prices);
        const volumeTrend = calcVolumeTrend(volumes);
        const dayChange = quote?.dp || 0;

        return {
            currentPrice,
            sma20,
            sma50,
            sma200,
            ema20,
            rsi,
            macd,
            volumeTrend,
            dayChange,
            sector: profile?.finnhubIndustry || 'Unknown'
        };
    }, [candles, quote, profile]);

    // Generate AI insight based on indicators
    const generateInsight = useCallback((indicators) => {
        if (!indicators) return null;

        const { currentPrice, sma20, sma50, sma200, ema20, rsi, macd, volumeTrend, dayChange, sector } = indicators;

        // Scoring system for bias
        let score = 0;
        const reasons = [];

        // Price vs SMAs
        if (sma20 && currentPrice > sma20) {
            score += 1;
            reasons.push('Price trading above 20-day SMA indicates short-term strength');
        } else if (sma20) {
            score -= 1;
            reasons.push('Price below 20-day SMA suggests short-term weakness');
        }

        if (sma50 && currentPrice > sma50) {
            score += 1;
            reasons.push('Price above 50-day SMA supports medium-term bullish bias');
        } else if (sma50) {
            score -= 1;
        }

        if (sma200 && currentPrice > sma200) {
            score += 1;
            if (!reasons.some(r => r.includes('200'))) {
                reasons.push('Trading above 200-day SMA confirms long-term uptrend');
            }
        } else if (sma200) {
            score -= 1;
        }

        // RSI analysis
        if (rsi !== null) {
            if (rsi > 70) {
                score -= 1;
                reasons.push(`RSI at ${rsi.toFixed(1)} indicates overbought conditions`);
            } else if (rsi < 30) {
                score += 1;
                reasons.push(`RSI at ${rsi.toFixed(1)} indicates oversold conditions (potential reversal)`);
            } else if (rsi > 50) {
                score += 0.5;
                reasons.push(`RSI at ${rsi.toFixed(1)} shows bullish momentum`);
            } else {
                score -= 0.5;
                reasons.push(`RSI at ${rsi.toFixed(1)} shows neutral to bearish momentum`);
            }
        }

        // MACD analysis
        if (macd !== null) {
            if (macd > 0) {
                score += 1;
                reasons.push('Positive MACD crossover suggests bullish momentum');
            } else {
                score -= 1;
                reasons.push('Negative MACD indicates bearish momentum');
            }
        }

        // Volume trend
        if (volumeTrend === 'increasing' && dayChange > 0) {
            score += 0.5;
            reasons.push('Increasing volume on up-move confirms buying pressure');
        } else if (volumeTrend === 'increasing' && dayChange < 0) {
            score -= 0.5;
            reasons.push('Increasing volume on down-move indicates selling pressure');
        }

        // Day change momentum
        if (dayChange > 2) {
            score += 0.5;
        } else if (dayChange < -2) {
            score -= 0.5;
        }

        // Determine bias
        let bias, confidence;
        if (score >= 3) {
            bias = 'Bullish';
            confidence = 'High';
        } else if (score >= 1.5) {
            bias = 'Bullish';
            confidence = 'Medium';
        } else if (score >= 0.5) {
            bias = 'Bullish';
            confidence = 'Low';
        } else if (score <= -3) {
            bias = 'Bearish';
            confidence = 'High';
        } else if (score <= -1.5) {
            bias = 'Bearish';
            confidence = 'Medium';
        } else if (score <= -0.5) {
            bias = 'Bearish';
            confidence = 'Low';
        } else {
            bias = 'Neutral';
            confidence = 'Medium';
        }

        // Generate outlooks
        const shortTermOutlook = bias === 'Bullish'
            ? `Price may test resistance levels with potential upside of 2-5% in the coming week if momentum sustains.`
            : bias === 'Bearish'
                ? `Price may test support levels with potential downside risk of 2-5% in the near term.`
                : `Price likely to consolidate within current range. Watch for breakout signals.`;

        const midTermOutlook = bias === 'Bullish'
            ? `Sustained bullish momentum could lead to continuation pattern. Monitor SMA crossovers for confirmation.`
            : bias === 'Bearish'
                ? `Extended weakness possible if key support levels break. Consider risk management strategies.`
                : `Sideways movement expected. Accumulation or distribution patterns may emerge.`;

        return {
            bias,
            confidence,
            shortTermOutlook,
            midTermOutlook,
            reasons: reasons.slice(0, 5),
            indicators,
            generatedAt: new Date().toLocaleTimeString()
        };
    }, []);

    // Refresh insight
    const refreshInsight = useCallback(() => {
        if (cooldown > 0) return;

        setLoading(true);
        // Simulate processing time
        setTimeout(() => {
            const indicators = calculateIndicators();
            const newInsight = generateInsight(indicators);
            setInsight(newInsight);
            setLoading(false);
            setLastRefresh(new Date());
            setCooldown(30);
        }, 1500);
    }, [cooldown, calculateIndicators, generateInsight]);

    // Auto-generate on mount
    useEffect(() => {
        if (!insight && candles?.c?.length > 20) {
            refreshInsight();
        }
    }, [candles]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const getBiasColor = (bias) => {
        if (bias === 'Bullish') return '#10b981';
        if (bias === 'Bearish') return '#ef4444';
        return '#f59e0b';
    };

    const getConfidenceColor = (conf) => {
        if (conf === 'High') return '#10b981';
        if (conf === 'Medium') return '#f59e0b';
        return '#94a3b8';
    };

    return (
        <div className="bg-glass rounded-lg p-md">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h5 className="mb-0 text-white d-flex align-items-center gap-2">
                        AI Market Insight
                        <span className="badge rounded-pill" style={{
                            fontSize: '0.55rem',
                            padding: '3px 8px',
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#a78bfa'
                        }}>
                            Beta
                        </span>
                    </h5>
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                        AI-generated analysis for {symbol}
                    </span>
                </div>
                <button
                    className="btn btn-glass btn-sm d-flex align-items-center gap-1"
                    onClick={refreshInsight}
                    disabled={loading || cooldown > 0}
                    style={{ fontSize: '0.7rem' }}
                >
                    {loading ? (
                        <>⟳ Analyzing...</>
                    ) : cooldown > 0 ? (
                        <>⏳ {cooldown}s</>
                    ) : (
                        <>↻ Refresh</>
                    )}
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-4">
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Analyzing market data...
                    </div>
                </div>
            )}

            {/* Insight Content */}
            {!loading && insight && (
                <div>
                    {/* Bias & Confidence */}
                    <div className="d-flex gap-3 mb-4">
                        <div className="flex-grow-1 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span className="text-muted d-block mb-1" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>Overall Bias</span>
                            <span className="fw-bold" style={{ fontSize: '1.2rem', color: getBiasColor(insight.bias) }}>
                                {insight.bias === 'Bullish' ? '↑' : insight.bias === 'Bearish' ? '↓' : '→'} {insight.bias}
                            </span>
                        </div>
                        <div className="flex-grow-1 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span className="text-muted d-block mb-1" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>Confidence</span>
                            <span className="fw-bold" style={{ fontSize: '1.2rem', color: getConfidenceColor(insight.confidence) }}>
                                {insight.confidence}
                            </span>
                        </div>
                    </div>

                    {/* Outlooks */}
                    <div className="mb-4">
                        <div className="mb-3">
                            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                                Short-Term Outlook (1-7 days)
                            </h6>
                            <p className="text-white mb-0" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                                {insight.shortTermOutlook}
                            </p>
                        </div>
                        <div>
                            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                                Mid-Term Outlook (1-4 weeks)
                            </h6>
                            <p className="text-white mb-0" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                                {insight.midTermOutlook}
                            </p>
                        </div>
                    </div>

                    {/* Key Reasoning */}
                    <div className="mb-4">
                        <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                            Key Observations
                        </h6>
                        <ul className="mb-0 ps-3" style={{ fontSize: '0.75rem' }}>
                            {insight.reasons.map((reason, i) => (
                                <li key={i} className="text-white mb-1" style={{ lineHeight: 1.4 }}>
                                    {reason}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Timestamp */}
                    <div className="text-muted mb-3" style={{ fontSize: '0.6rem' }}>
                        Generated at {insight.generatedAt}
                    </div>
                </div>
            )}

            {/* No Data State */}
            {!loading && !insight && (
                <div className="text-center py-4">
                    <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>
                        Insufficient data for analysis
                    </p>
                    <button className="btn btn-glass btn-sm" onClick={refreshInsight}>
                        Try Again
                    </button>
                </div>
            )}

            {/* Disclaimer */}
            <div className="p-2 rounded-2" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <p className="mb-0 text-center" style={{ fontSize: '0.6rem', color: '#f59e0b' }}>
                    ⚠️ <strong>Educational purposes only.</strong> This AI-generated analysis is not financial advice.
                    Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
                </p>
            </div>
        </div>
    );
}

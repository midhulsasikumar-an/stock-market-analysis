import React, { useState, useEffect } from "react";
import { fetchCandles } from "../services/finnhub";

// Helper components for internal layout
const SectionHeader = ({ title }) => (
    <h6 className="text-secondary text-xs text-uppercase letter-spacing-wide mb-3 mt-4 border-bottom border-secondary pb-2">
        {title}
    </h6>
);

const MetricCard = ({ label, value, signal, subValue }) => {
    let color = "text-white";
    if (signal === "Bullish" || signal === "Strong Buy" || signal === "Oversold") color = "text-success";
    if (signal === "Bearish" || signal === "Strong Sell" || signal === "Overbought") color = "text-danger";

    const displayValue = (value === null || value === undefined) ? "N/A" : value;
    const displayColor = (value === null || value === undefined) ? "text-muted" : color;

    return (
        <div className="bg-white-5 rounded p-3 text-center w-100">
            <span className="text-muted text-xs d-block mb-1">{label}</span>
            <span className={`fw-bold text-lg d-block ${displayColor}`}>{displayValue}</span>
            {subValue && <span className="text-muted text-xs">{subValue}</span>}
        </div>
    );
};

export default function TechnicalAnalysis({ symbol, quote, candles }) {
    const [status, setStatus] = useState("loading");
    const [data, setData] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [extendedCandles, setExtendedCandles] = useState(null);

    // Reset state on symbol change to ensure fresh start
    useEffect(() => {
        setStatus("loading");
        setData(null);
        setExtendedCandles(null);
        setErrorMsg("");
    }, [symbol]);

    // ANALYSIS LOGIC (Synchronous calculation helper)
    const calculateIndicators = (candlesToUse, currentPrice) => {
        if (!candlesToUse || !candlesToUse.c || candlesToUse.c.length === 0) {
            throw new Error("No historical data available for calculation.");
        }

        // Clone to avoid mutating props/state directly
        let closes = [...candlesToUse.c];

        // MERGE REAL-TIME DATA:
        // If we have a live price, we should make sure the "latest" data point reflects it.
        // Finnhub 'D' candles are end-of-day. During market hours, the last candle might be yesterday's close,
        // or a partial daily candle.
        // Strategy: Append current price as a new "potential" close for today if it seems missing,
        // or replace the last one if it looks like a partial candle.
        // For simplicity and responsiveness: We push the current live price as the "latest relevant price"
        // for calculation, assuming the user wants to know "What do indicators say RIGHT NOW?".
        if (currentPrice) {
            // Check if the last candle timestamp is effectively "today". 
            // If yes, update it. If no, push new.
            // Actually, simpler: Just perform calculation on (History + Current Price).
            // But standard indicators (RSI) need a sequence.
            // Let's replace the last close with Current Price to simulate "Live Candle" closing at this price right now.
            closes[closes.length - 1] = currentPrice;
        }

        const len = closes.length;
        const current = closes[len - 1];

        // --- RSI (14) ---
        const calculateRSI = (prices, period = 14) => {
            if (prices.length < period + 1) return null;
            let gains = 0, losses = 0;
            for (let i = 1; i <= period; i++) {
                const change = prices[i] - prices[i - 1];
                if (change > 0) gains += change; else losses += Math.abs(change);
            }
            let avgGain = gains / period;
            let avgLoss = losses / period;
            for (let i = period + 1; i < prices.length; i++) {
                const change = prices[i] - prices[i - 1];
                const gain = change > 0 ? change : 0;
                const loss = change < 0 ? Math.abs(change) : 0;
                avgGain = ((avgGain * (period - 1)) + gain) / period;
                avgLoss = ((avgLoss * (period - 1)) + loss) / period;
            }
            if (avgLoss === 0) return 100;
            const rs = avgGain / avgLoss;
            return 100 - (100 / (1 + rs));
        };

        const rsiVal = calculateRSI(closes, 14);
        let rsi = rsiVal !== null ? rsiVal.toFixed(2) : null;
        let rsiSignal = "Neutral";
        if (rsiVal !== null) {
            if (rsiVal < 30) rsiSignal = "Oversold";
            else if (rsiVal > 70) rsiSignal = "Overbought";
        } else {
            rsiSignal = "Insuff. Data";
        }

        // --- 7D Change & Trend ---
        let change7 = null, trend7Signal = "Sideways";
        if (len >= 2) {
            const daysBack = len >= 8 ? 7 : len - 1;
            const prevPrice = closes[len - 1 - daysBack];
            const rawChange = ((current - prevPrice) / prevPrice) * 100;
            change7 = rawChange.toFixed(2) + "%";

            if (rawChange > 0.5) trend7Signal = "Bullish";
            else if (rawChange < -0.5) trend7Signal = "Bearish";
        } else {
            trend7Signal = "Insuff. Data";
        }

        // --- SMAs ---
        const getSMA = (n) => {
            if (closes.length < n) return null;
            return closes.slice(-n).reduce((sum, val) => sum + val, 0) / n;
        };

        const sma7Val = getSMA(7);
        const sma30Val = getSMA(30);

        const sma7 = sma7Val !== null ? sma7Val.toFixed(2) : null;
        const sma30 = sma30Val !== null ? sma30Val.toFixed(2) : null;

        const sma7Signal = sma7Val !== null ? (current > sma7Val ? "Bullish" : "Bearish") : "Insuff. Data";
        const sma30Signal = sma30Val !== null ? (current > sma30Val ? "Bullish" : "Bearish") : "Insuff. Data";

        // --- Verdict ---
        let score = 0;
        let validIndicators = 0;

        if (rsiVal !== null) { validIndicators++; if (rsiSignal === "Oversold") score += 2; if (rsiSignal === "Overbought") score -= 2; }
        if (sma7Val !== null && sma30Val !== null) { validIndicators++; if (sma7Val > sma30Val) score += 2; else score -= 2; }
        if (sma7Val !== null) { validIndicators++; if (current > sma7Val) score += 1; else score -= 1; }
        if (sma30Val !== null) { validIndicators++; if (current > sma30Val) score += 1; else score -= 1; }
        if (change7 !== null) { validIndicators++; if (trend7Signal === "Bullish") score += 1; if (trend7Signal === "Bearish") score -= 1; }

        let overallSignal = "HOLD";
        let confidence = "Low";

        if (score >= 2) { overallSignal = "BUY"; confidence = validIndicators > 3 ? "Moderate" : "Low"; }
        if (score >= 4) { overallSignal = "STRONG BUY"; confidence = "High"; }
        if (score <= -2) { overallSignal = "SELL"; confidence = validIndicators > 3 ? "Moderate" : "Low"; }
        if (score <= -4) { overallSignal = "STRONG SELL"; confidence = "High"; }

        if (validIndicators < 2) {
            overallSignal = "NEUTRAL";
            confidence = "Very Low (Insuff. Data)";
        }

        const summaryText = `Technicals suggest a ${overallSignal} position based on ${validIndicators} indicators. Trend is ${trend7Signal.toLowerCase()}.`;

        return {
            rsi, rsiSignal,
            change7, trend7Signal,
            sma7, sma7Signal,
            sma30, sma30Signal,
            overallSignal, confidence, summaryText
        };
    };

    // MAIN EFFECT
    useEffect(() => {
        let isMounted = true;

        const runProcess = async () => {
            // 1. Guard against mount before props
            // NOTE: If parent passes null, we treat it as "no data yet" or "error".
            // Since parent Loading state avoids rendering us until ready, null means ERROR or EMPTY.
            if (!candles) {
                if (isMounted) setStatus("insufficient_data");
                return;
            }

            // 2. Determine Data Source
            let activeCandles = extendedCandles || candles;

            try {
                // 3. Adaptive Fetch Check
                // Only run if we haven't already extended AND data is short
                // AND ExtendedCandles is null (meaning we haven't tried fetching history yet)
                if (candles.c && candles.c.length < 30 && extendedCandles === null) {
                    if (isMounted) setStatus("fetching_history");

                    const moreData = await fetchCandles(symbol, 'D', 90);

                    if (!isMounted) return;

                    if (moreData && moreData.c && moreData.c.length > candles.c.length) {
                        setExtendedCandles(moreData);
                        // RETURN here to let effect re-run with new extendedCandles
                        return;
                    } else {
                        // Mark as tried so we don't loop
                        setExtendedCandles(candles);
                        // Continue to analysis with original data
                        activeCandles = candles;
                    }
                }

                // 4. Run Analysis
                if (isMounted) setStatus("calculating");

                // Simulate short delay for UX smoothness (optional)
                await new Promise(r => setTimeout(r, 500));

                if (!isMounted) return;

                if (activeCandles && activeCandles.c && activeCandles.c.length > 0) {
                    // Pass current real-time price if available
                    const currentPrice = quote ? quote.c : null;
                    const results = calculateIndicators(activeCandles, currentPrice);

                    setData(results);
                    setStatus("completed");
                } else {
                    setStatus("insufficient_data");
                }

            } catch (err) {
                console.error("TA Error:", err);
                if (isMounted) {
                    setErrorMsg(err.message);
                    setStatus("error");
                }
            }
        };

        runProcess();

        return () => { isMounted = false; };
    }, [candles, extendedCandles, symbol, quote]);

    // Manual Refresh
    const handleRefresh = () => {
        setStatus("loading");
        // Start from scratch to re-verify or just re-run?
        // Let's reset extended to force a re-check if needed, or just re-run current.
        // Simple re-run:
        const active = extendedCandles || candles;
        if (active) {
            // Trigger effect? Or call directly? 
            // Setting extendedCandles to null triggers effect re-run from scratch (including adaptive fetch check)
            setExtendedCandles(null);
        }
    };

    return (
        <section className="d-flex flex-column h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="section-title mb-0">
                    Technical Analysis <span className="badge bg-danger ms-2 animate-pulse text-xs">LIVE</span>
                </h3>
                <button
                    onClick={handleRefresh}
                    disabled={status !== "completed" && status !== "error" && status !== "insufficient_data"}
                    className="btn btn-sm btn-glass text-white opacity-75 hover-opacity-100"
                >
                    ⟳ Refresh
                </button>
            </div>

            {/* LOADING STATES */}
            {(status === "loading" || status === "fetching_history") && (
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-5 text-center fade-in">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <p className="text-white animate-pulse">
                        {status === "fetching_history" ? "Fetching historical data..." : "Checking market data..."}
                    </p>
                </div>
            )}

            {status === "calculating" && (
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-5 text-center fade-in">
                    <div className="spinner-border text-info mb-3" role="status"></div>
                    <p className="text-white animate-pulse">Calculating indicators...</p>
                </div>
            )}

            {(status === "insufficient_data" || status === "restricted") && (
                <div className="flex-grow-1 position-relative d-flex flex-column p-4 border border-light-5 rounded overflow-hidden">
                    {/* Blurred Mock Content Background */}
                    <div style={{ filter: 'blur(5px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
                        <div className="row g-3">
                            <div className="col-12"><SectionHeader title="Momentum & Trend" /></div>
                            <div className="d-flex gap-3">
                                <MetricCard label="RSI (14)" value="45.2" signal="Neutral" />
                                <MetricCard label="7D Change" value="+1.2%" signal="Bullish" />
                            </div>
                            <div className="col-12"><SectionHeader title="Moving Averages" /></div>
                            <div className="d-flex gap-3">
                                <MetricCard label="SMA (20)" value="142.5" signal="Bullish" />
                                <MetricCard label="SMA (50)" value="138.2" signal="Bearish" />
                            </div>
                        </div>
                    </div>

                    {/* Premium Lock Overlay */}
                    <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ width: '80%' }}>
                        <div className="bg-glass-dark p-4 rounded-4 border border-warning border-opacity-25 shadow-lg backdrop-blur">
                            <div className="mb-2 text-warning display-6">
                                {status === "restricted" ? "🔒" : "⚠️"}
                            </div>
                            <h5 className="text-white fw-bold mb-1">
                                {status === "restricted" ? "Premium Analysis Locked" : "Insufficient Data"}
                            </h5>
                            <p className="text-muted text-xs mb-0">
                                {status === "restricted"
                                    ? "Upgrade to Pro to view real-time technical signals and advanced indicators."
                                    : "Not enough historical market data to generate reliable technical signals."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center text-danger p-5 bg-white-5 rounded border border-danger border-opacity-25 fadeIn">
                    <p className="mb-1 text-sm">Service temporarily unavailable</p>
                    <small className="text-xs opacity-75">Check network connection or symbol validity</small>
                </div>
            )}

            {/* COMPLETED RESULTS */}
            {status === "completed" && data && (
                <div className="fadeIn">
                    {/* Verdict Card */}
                    <div className="p-3 rounded mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="d-flex justify-content-between align-items-end mb-2">
                            <h2 className={`fw-bold mb-0 ${data.overallSignal.includes("BUY") ? "text-success" : data.overallSignal.includes("SELL") ? "text-danger" : "text-white"}`}>
                                {data.overallSignal}
                            </h2>
                            <span className={`text-xs text-uppercase px-2 py-1 rounded bg-white-10 text-white`}>
                                Conf: {data.confidence}
                            </span>
                        </div>
                        <p className="text-muted text-sm mb-0 fst-italic">
                            {data.summaryText}
                        </p>
                    </div>

                    <div className="row g-3">
                        {/* Momentum */}
                        <div className="col-12">
                            <SectionHeader title="Momentum & Trend" />
                            <div className="d-flex gap-3">
                                <MetricCard
                                    label="RSI (14)"
                                    value={data.rsi}
                                    signal={data.rsiSignal}
                                    subValue={data.rsiSignal}
                                />
                                <MetricCard
                                    label="7D Change"
                                    value={data.change7}
                                    signal={data.trend7Signal}
                                    subValue={data.trend7Signal}
                                />
                            </div>
                        </div>

                        {/* Averages */}
                        <div className="col-12">
                            <SectionHeader title="Moving Averages" />
                            <div className="d-flex gap-3">
                                <MetricCard
                                    label="SMA (7)"
                                    value={data.sma7}
                                    signal={data.sma7Signal}
                                    subValue="Short Term"
                                />
                                <MetricCard
                                    label="SMA (30)"
                                    value={data.sma30}
                                    signal={data.sma30Signal}
                                    subValue="Medium Term"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

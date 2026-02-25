/**
 * Price_Chart.js — TradingView Lightweight Charts candlestick
 * Uses the official @tradingview/lightweight-charts library (v5)
 * Exact same rendering engine as TradingView.com
 */
import React, {
    useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import {
    createChart,
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
} from 'lightweight-charts';
import { fetchCandles } from '../services/finnhub';

// ─── Time ranges ──────────────────────────────────────────────────────────────
const TIME_RANGES = [
    { label: '1D', days: 1, resolution: '5' },
    { label: '5D', days: 5, resolution: '15' },
    { label: '1M', days: 30, resolution: 'D' },
    { label: '3M', days: 90, resolution: 'D' },
    { label: '6M', days: 180, resolution: 'W' },
    { label: '1Y', days: 365, resolution: 'W' },
    { label: 'All', days: 1825, resolution: 'W' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, d = 2) => n == null ? '---' : Number(n).toFixed(d);
const fmtV = (v) => {
    if (!v) return '---';
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toString();
};

// SMA
const calcSMA = (closes, period) => {
    const out = Array(closes.length).fill(null);
    for (let i = period - 1; i < closes.length; i++) {
        const s = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        out[i] = s / period;
    }
    return out;
};

// EMA
const calcEMA = (closes, period) => {
    const k = 2 / (period + 1);
    const out = Array(closes.length).fill(null);
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    out[period - 1] = ema;
    for (let i = period; i < closes.length; i++) {
        ema = closes[i] * k + ema * (1 - k);
        out[i] = ema;
    }
    return out;
};

// Build lightweight-charts data arrays from Finnhub candle response
const buildCandleData = (candles) => {
    if (!candles || candles.s !== 'ok' || !candles.t?.length) return null;
    const { t, o, h, l, c, v } = candles;
    const cd = [], vd = [];
    for (let i = 0; i < t.length; i++) {
        if (o[i] == null || h[i] == null || l[i] == null || c[i] == null) continue;
        cd.push({ time: t[i], open: o[i], high: h[i], low: l[i], close: c[i] });
        vd.push({
            time: t[i],
            value: v[i] ?? 0,
            color: c[i] >= o[i] ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
        });
    }
    return cd.length >= 2 ? { cd, vd, closes: c, timestamps: t } : null;
};

// ─── Shared chart theme ───────────────────────────────────────────────────────
const CHART_OPTS = {
    layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontFamily: "'Inter','JetBrains Mono',monospace",
    },
    grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
    },
    crosshair: {
        mode: 1, // Magnet to candle
        vertLine: {
            width: 1,
            color: 'rgba(255,255,255,0.3)',
            style: 3,
            labelBackgroundColor: '#1e2d45',
        },
        horzLine: {
            width: 1,
            color: 'rgba(255,255,255,0.2)',
            style: 3,
            labelBackgroundColor: '#1e2d45',
        },
    },
    rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        textColor: 'rgba(255,255,255,0.4)',
        scaleMargins: { top: 0.08, bottom: 0.25 },
    },
    timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        textColor: 'rgba(255,255,255,0.35)',
        rightOffset: 5,
        barSpacing: 8,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        timeVisible: true,
        secondsVisible: false,
    },
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
    handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
};

const CANDLE_OPTS = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderUpColor: '#26a69a',
    borderDownColor: '#ef5350',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Price_Chart({ symbol, candles: initialCandles, compact = false, title }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef({ candle: null, vol: null, sma20: null, sma50: null, sma200: null, ema20: null });
    const resizeObs = useRef(null);

    const [activeRange, setActiveRange] = useState('1M');
    const [status, setStatus] = useState(initialCandles ? 'success' : 'loading');
    const [rawCandles, setRawCandles] = useState(initialCandles || null);

    const [indicators, setIndicators] = useState({
        sma20: true, sma50: false, sma200: false, ema20: false, volume: true,
    });

    // Crosshair tooltip state
    const [tooltip, setTooltip] = useState(null); // { o,h,l,c,v,time }

    const toggle = (key) => setIndicators(p => ({ ...p, [key]: !p[key] }));

    // ── Load data ─────────────────────────────────────────────────────────────
    const loadData = useCallback(async (rangeLabel) => {
        if (!symbol) return;
        setStatus('loading');
        const cfg = TIME_RANGES.find(r => r.label === rangeLabel);
        try {
            const data = await fetchCandles(symbol, cfg.resolution, cfg.days);
            if (data?.s === 'ok' && data.c?.length > 2) {
                setRawCandles(data); setStatus('success');
            } else if (data?.s === 'rate_limited') {
                setStatus('rate_limited');
            } else {
                setStatus(data?.s === 'no_data' ? 'empty' : 'error');
            }
        } catch { setStatus('error'); }
    }, [symbol]);

    useEffect(() => {
        if (initialCandles) { setRawCandles(initialCandles); setStatus(initialCandles.s === 'ok' && initialCandles.c?.length > 2 ? 'success' : 'error'); }
    }, [initialCandles]);

    useEffect(() => {
        if (!symbol || initialCandles) return;
        loadData(activeRange);
    }, [symbol, activeRange, initialCandles, loadData]);

    // ── Parse candle data ─────────────────────────────────────────────────────
    const parsed = useMemo(() => buildCandleData(rawCandles), [rawCandles]);

    // ── Create chart ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            ...CHART_OPTS,
            width: containerRef.current.clientWidth,
            height: compact ? 260 : 440,
        });
        chartRef.current = chart;

        // Candlestick series
        seriesRef.current.candle = chart.addSeries(CandlestickSeries, CANDLE_OPTS);

        // Volume pane (lower sub-pane)
        seriesRef.current.vol = chart.addSeries(HistogramSeries, {
            priceScaleId: 'vol',
            priceFormat: { type: 'volume' },
        });
        chart.priceScale('vol').applyOptions({
            scaleMargins: { top: 0.82, bottom: 0 },
        });

        // Indicator line series
        seriesRef.current.sma20 = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
        seriesRef.current.sma50 = chart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
        seriesRef.current.sma200 = chart.addSeries(LineSeries, { color: '#c084fc', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
        seriesRef.current.ema20 = chart.addSeries(LineSeries, { color: '#34d399', lineWidth: 1.5, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });

        // Crosshair subscription
        chart.subscribeCrosshairMove((param) => {
            if (!param.time || !param.seriesData) { setTooltip(null); return; }
            const candle = param.seriesData.get(seriesRef.current.candle);
            const vol = param.seriesData.get(seriesRef.current.vol);
            if (candle) {
                setTooltip({ ...candle, v: vol?.value ?? 0 });
            }
        });

        // ResizeObserver
        resizeObs.current = new ResizeObserver(entries => {
            for (const e of entries) {
                chart.resize(e.contentRect.width, compact ? 260 : 440);
            }
        });
        resizeObs.current.observe(containerRef.current);

        return () => {
            resizeObs.current?.disconnect();
            chart.remove();
            chartRef.current = null;
            Object.keys(seriesRef.current).forEach(k => { seriesRef.current[k] = null; });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // ── Feed data to series ───────────────────────────────────────────────────
    useEffect(() => {
        if (!parsed || !seriesRef.current.candle) return;
        const { cd, vd, closes, timestamps } = parsed;

        seriesRef.current.candle.setData(cd);

        // Volume
        seriesRef.current.vol.setData(indicators.volume ? vd : []);

        // Indicators — build time-value arrays
        const buildLine = (vals) =>
            vals.map((v, i) => v != null ? { time: timestamps[i], value: v } : null).filter(Boolean);

        seriesRef.current.sma20.setData(indicators.sma20 ? buildLine(calcSMA(closes, 20)) : []);
        seriesRef.current.sma50.setData(indicators.sma50 ? buildLine(calcSMA(closes, 50)) : []);
        seriesRef.current.sma200.setData(indicators.sma200 ? buildLine(calcSMA(closes, 200)) : []);
        seriesRef.current.ema20.setData(indicators.ema20 ? buildLine(calcEMA(closes, 20)) : []);

        chartRef.current?.timeScale().fitContent();
    }, [parsed, indicators]);

    // Update vol/indicators when toggled (without refetching)
    useEffect(() => {
        if (!parsed || !seriesRef.current.candle) return;
        const { vd, closes, timestamps } = parsed;
        const buildLine = (vals) =>
            vals.map((v, i) => v != null ? { time: timestamps[i], value: v } : null).filter(Boolean);

        seriesRef.current.vol.setData(indicators.volume ? vd : []);
        seriesRef.current.sma20.setData(indicators.sma20 ? buildLine(calcSMA(closes, 20)) : []);
        seriesRef.current.sma50.setData(indicators.sma50 ? buildLine(calcSMA(closes, 50)) : []);
        seriesRef.current.sma200.setData(indicators.sma200 ? buildLine(calcSMA(closes, 200)) : []);
        seriesRef.current.ema20.setData(indicators.ema20 ? buildLine(calcEMA(closes, 20)) : []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [indicators]);

    // ── Derived display values ────────────────────────────────────────────────
    const lastCandle = parsed?.cd[parsed.cd.length - 1];
    const firstCandle = parsed?.cd[0];
    const displayCandle = tooltip || lastCandle;
    const isUp = lastCandle ? lastCandle.close >= lastCandle.open : true;
    const dayChange = lastCandle && firstCandle ? lastCandle.close - firstCandle.open : null;
    const dayChangePct = dayChange != null && firstCandle?.open ? (dayChange / firstCandle.open) * 100 : null;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="tv-chart-wrap">

            {/* Header */}
            <div className="tv-chart-header">
                <div className="tv-chart-header-left">
                    {title && <span className="tv-chart-title">{title}</span>}
                    {symbol && <span className="tv-chart-symbol">{symbol}</span>}

                    {/* OHLC display */}
                    {displayCandle && status === 'success' && (
                        <span className="tv-chart-ohlc">
                            <span className="ohlc-label">O</span>
                            <span className="ohlc-val">{fmt(displayCandle.open)}</span>
                            <span className="ohlc-label">H</span>
                            <span className="ohlc-val ohlc-high">{fmt(displayCandle.high)}</span>
                            <span className="ohlc-label">L</span>
                            <span className="ohlc-val ohlc-low">{fmt(displayCandle.low)}</span>
                            <span className="ohlc-label">C</span>
                            <span className={`ohlc-val ${displayCandle.close >= displayCandle.open ? 'ohlc-high' : 'ohlc-low'}`}>
                                {fmt(displayCandle.close)}
                            </span>
                            {displayCandle.v != null && (
                                <>
                                    <span className="ohlc-label">Vol</span>
                                    <span className="ohlc-val">{fmtV(displayCandle.v)}</span>
                                </>
                            )}
                        </span>
                    )}
                </div>

                <div className="tv-chart-header-right">
                    {/* Indicators */}
                    <div className="tv-ind-row">
                        {[
                            { key: 'sma20', color: '#fbbf24', label: 'SMA 20' },
                            { key: 'sma50', color: '#60a5fa', label: 'SMA 50' },
                            { key: 'sma200', color: '#c084fc', label: 'SMA 200' },
                            { key: 'ema20', color: '#34d399', label: 'EMA 20' },
                            { key: 'volume', color: '#94a3b8', label: 'Vol' },
                        ].map(({ key, color, label }) => (
                            <button
                                key={key}
                                className={`tv-ind-btn ${indicators[key] ? 'tv-ind-on' : ''}`}
                                style={indicators[key] ? { borderColor: color, color } : {}}
                                onClick={() => toggle(key)}
                            >{label}</button>
                        ))}
                    </div>

                    {/* Timeframes */}
                    <div className="tv-tf-row">
                        {TIME_RANGES.map(r => (
                            <button
                                key={r.label}
                                className={`tv-tf-btn ${activeRange === r.label ? 'tv-tf-active' : ''}`}
                                onClick={() => setActiveRange(r.label)}
                            >{r.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Change strip */}
            {status === 'success' && dayChange !== null && (
                <div className="tv-change-strip">
                    <span className="tv-change-price">${fmt(lastCandle?.close)}</span>
                    <span className={`tv-change-delta ${dayChange >= 0 ? 'up' : 'down'}`}>
                        {dayChange >= 0 ? '+' : ''}{fmt(dayChange)}
                        {' '}({dayChange >= 0 ? '+' : ''}{fmt(dayChangePct)}%)
                    </span>
                    <span className="tv-change-period">{activeRange}</span>
                </div>
            )}

            {/* Chart body */}
            <div className="tv-chart-body" style={{ minHeight: compact ? 260 : 440, position: 'relative' }}>
                {status === 'loading' && (
                    <div className="tv-chart-loader">
                        <div className="tv-spinner"></div>
                        <span>Loading chart…</span>
                    </div>
                )}
                {status !== 'loading' && status !== 'success' && (
                    <div className="tv-chart-error">
                        <span className="tv-chart-error-icon">
                            {status === 'rate_limited' ? '📊' : '⚠️'}
                        </span>
                        <p>
                            {status === 'rate_limited'
                                ? 'Chart quota reached — resets at midnight UTC'
                                : status === 'empty'
                                    ? 'No historical data available'
                                    : 'Unable to load chart data'}
                        </p>
                    </div>
                )}
                {/* The chart mounts here via ref. Always render the div so the chart has a DOM node. */}
                <div
                    ref={containerRef}
                    style={{
                        width: '100%',
                        height: compact ? 260 : 440,
                        display: status === 'success' ? 'block' : 'none',
                    }}
                />
            </div>
        </div>
    );
}

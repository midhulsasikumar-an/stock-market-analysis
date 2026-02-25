/**
 * Market_Overview_Dash.js — TradingView-style Market Summary
 * Uses the official lightweight-charts AreaSeries for the intraday chart
 * Exact same rendering engine as TradingView.com
 */
import React, {
  useEffect, useState, useRef, useCallback, useMemo, memo
} from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import { fetchQuote, fetchCandles } from '../services/finnhub';
import './MarketSnapshot.css';

// ─── Index definitions ────────────────────────────────────────────────────────
const INDICES = [
  { symbol: 'SPY', label: 'S&P 500', tag: 'SPY' },
  { symbol: 'QQQ', label: 'NASDAQ 100', tag: 'QQQ' },
  { symbol: 'DIA', label: 'Dow Jones', tag: 'DIA' },
  { symbol: 'NVDA', label: 'NVIDIA', tag: 'NVDA' },
  { symbol: 'AAPL', label: 'Apple', tag: 'AAPL' },
  { symbol: 'TSLA', label: 'Tesla', tag: 'TSLA' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, d = 2) => n == null ? '---' : Number(n).toFixed(d);

const buildAreaData = (candles) => {
  if (!candles || candles.s !== 'ok' || !candles.t?.length) return null;
  return candles.t.map((t, i) => ({
    time: t,
    value: candles.c[i],
  })).filter(d => d.value != null);
};

// ─── Area chart sub-component ─────────────────────────────────────────────────
const AreaChart = memo(({ candles, isUp, onCrosshair }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const resizeObs = useRef(null);

  const col = isUp ? '#26a69a' : '#ef5350';
  const colFade = isUp ? 'rgba(38,166,154,0)' : 'rgba(239,83,80,0)';

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 150,
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontFamily: "'Inter', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(255,255,255,0.3)',
          style: 3,
          labelBackgroundColor: '#1e2d45',
        },
        horzLine: {
          color: 'rgba(255,255,255,0.15)',
          style: 3,
          labelBackgroundColor: '#1e2d45',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: 'rgba(255,255,255,0.3)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: 'rgba(255,255,255,0.3)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    seriesRef.current = chart.addSeries(AreaSeries, {
      lineColor: col,
      topColor: col.replace(')', ',0.28)').replace('rgb', 'rgba'),
      bottomColor: colFade,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      lastPriceAnimation: 1,
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !seriesRef.current) { onCrosshair(null); return; }
      const pt = param.seriesData.get(seriesRef.current);
      onCrosshair(pt ? { value: pt.value, time: param.time } : null);
    });

    resizeObs.current = new ResizeObserver(entries => {
      for (const e of entries) {
        chart.resize(e.contentRect.width, 150);
      }
    });
    resizeObs.current.observe(containerRef.current);

    return () => {
      resizeObs.current?.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update color when up/down changes
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({
      lineColor: col,
      topColor: isUp ? 'rgba(38,166,154,0.28)' : 'rgba(239,83,80,0.28)',
      bottomColor: colFade,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUp]);

  // Feed data
  useEffect(() => {
    const data = buildAreaData(candles);
    if (!data || !seriesRef.current) return;
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 150 }}
    />
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Market_Overview_Dash() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [quotes, setQuotes] = useState({});
  const [candlesMap, setCandlesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [crosshair, setCrosshair] = useState(null); // { value, time }

  // ── Fetch all ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled(
      INDICES.map(async (idx) => {
        const [q, c] = await Promise.all([
          fetchQuote(idx.symbol),
          fetchCandles(idx.symbol, '5', 1),
        ]);
        return { symbol: idx.symbol, quote: q, candles: c };
      })
    );
    const newQ = {}, newC = {};
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value.quote) {
        newQ[r.value.symbol] = r.value.quote;
        if (r.value.candles?.s === 'ok') newC[r.value.symbol] = r.value.candles;
      }
    });
    setQuotes(newQ);
    setCandlesMap(newC);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 60_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const active = INDICES[activeIdx];
  const quote = quotes[active?.symbol];
  const cdata = candlesMap[active?.symbol];
  const isUp = quote ? (quote.dp ?? 0) >= 0 : true;
  const col = isUp ? '#26a69a' : '#ef5350';

  // Switch tab — reset crosshair
  const handleTabClick = (i) => { setActiveIdx(i); setCrosshair(null); };

  return (
    <div className="ms-wrap">

      {/* Header */}
      <div className="ms-header">
        <h2 className="ms-title">
          Market summary <span className="ms-title-arrow">›</span>
        </h2>
        {lastUpdate && (
          <span className="ms-updated">
            {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <button className="ms-refresh-btn" onClick={fetchAll} title="Refresh">↻</button>
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="ms-tabs">
        {INDICES.map((idx, i) => {
          const q = quotes[idx.symbol];
          const up = q ? (q.dp ?? 0) >= 0 : true;
          return (
            <button
              key={idx.symbol}
              className={`ms-tab ${activeIdx === i ? 'ms-tab-active' : ''}`}
              onClick={() => handleTabClick(i)}
            >
              <span className="ms-tab-label">{idx.label}</span>
              {q && (
                <span className={`ms-tab-change ${up ? 'ms-up' : 'ms-down'}`}>
                  {up ? '+' : ''}{fmt(q.dp)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Card */}
      <div className="ms-card">
        {loading && !quote ? (
          <div className="ms-loading">
            <div className="tv-spinner"></div>
            <span>Loading market data…</span>
          </div>
        ) : (
          <>
            {/* Index header row */}
            <div className="ms-index-info">
              <div className="ms-index-badge">
                {active.tag.slice(0, 2).toUpperCase()}
              </div>
              <div className="ms-index-meta">
                <div className="ms-index-name-row">
                  <span className="ms-index-name">{active.label}</span>
                  <span className="ms-index-tag">{active.tag}</span>
                  <span className={`ms-index-dot ${isUp ? 'ms-dot-up' : 'ms-dot-dn'}`} />
                </div>
                {quote && (
                  <div className="ms-index-price-row">
                    {/* Show crosshair value if hovering, else last close */}
                    <span className="ms-index-price" style={{ color: crosshair ? col : undefined }}>
                      {crosshair
                        ? fmt(crosshair.value)
                        : fmt(quote.c)
                      }
                    </span>
                    <span className="ms-index-currency">USD</span>
                    <span className={`ms-index-pct ${isUp ? 'ms-up' : 'ms-down'}`}>
                      {isUp ? '+' : ''}{fmt(quote.dp)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Area Chart */}
            <div className="ms-chart-area">
              {cdata?.s === 'ok' ? (
                <AreaChart
                  key={active.symbol}   // re-mount chart when symbol changes
                  candles={cdata}
                  isUp={isUp}
                  onCrosshair={setCrosshair}
                />
              ) : (
                <div className="ms-no-data">
                  {quote ? (
                    <div className="ms-quote-fallback">
                      <span className="ms-qf-price" style={{ color: col }}>
                        ${fmt(quote.c)}
                      </span>
                      <span className={`ms-qf-change ${isUp ? 'ms-up' : 'ms-down'}`}>
                        {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{fmt(quote.d)} ({isUp ? '+' : ''}{fmt(quote.dp)}%)
                      </span>
                    </div>
                  ) : (
                    <p className="ms-no-data-hint">No data available</p>
                  )}
                  <p className="ms-no-data-hint">Intraday chart unavailable (API quota)</p>
                </div>
              )}
            </div>

            {/* OHLC stat strip */}
            {quote && (
              <div className="ms-stat-row">
                <div className="ms-stat">
                  <span className="ms-stat-label">Open</span>
                  <span className="ms-stat-val">{fmt(quote.o)}</span>
                </div>
                <div className="ms-stat">
                  <span className="ms-stat-label">Prev Close</span>
                  <span className="ms-stat-val">{fmt(quote.pc)}</span>
                </div>
                <div className="ms-stat">
                  <span className="ms-stat-label">Day High</span>
                  <span className="ms-stat-val ms-up">{fmt(quote.h)}</span>
                </div>
                <div className="ms-stat">
                  <span className="ms-stat-label">Day Low</span>
                  <span className="ms-stat-val ms-down">{fmt(quote.l)}</span>
                </div>
                <div className="ms-stat">
                  <span className="ms-stat-label">Change</span>
                  <span className={`ms-stat-val ${isUp ? 'ms-up' : 'ms-down'}`}>
                    {isUp ? '+' : ''}{fmt(quote.d)} ({isUp ? '+' : ''}{fmt(quote.dp)}%)
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom ticker bar */}
      <div className="ms-bottom-bar">
        {INDICES.map((idx, i) => {
          const q = quotes[idx.symbol];
          const up = q ? (q.dp ?? 0) >= 0 : true;
          return (
            <button
              key={idx.symbol}
              className={`ms-mini-item ${activeIdx === i ? 'ms-mini-active' : ''}`}
              onClick={() => handleTabClick(i)}
            >
              <span className="ms-mini-label">{idx.tag}</span>
              {q ? (
                <>
                  <span className="ms-mini-price">{fmt(q.c)}</span>
                  <span className={`ms-mini-pct ${up ? 'ms-up' : 'ms-down'}`}>
                    {up ? '+' : ''}{fmt(q.dp)}%
                  </span>
                </>
              ) : (
                <span className="ms-mini-price">---</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

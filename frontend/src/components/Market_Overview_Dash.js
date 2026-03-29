import React, {
  useEffect, useState, useRef, useCallback, useMemo, memo
} from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import { fetchQuote, fetchCandles } from '../services/finnhub';
import '../styles/DashboardRedesign.css';

const INDICES = [
  { symbol: 'SPY', label: 'S&P 500', tag: 'SEP 500' },
  { symbol: 'QQQ', label: 'NASDAQ 100', tag: 'NASDAQ' },
  { symbol: 'DIA', label: 'Dow Jones', tag: 'Dow-Jones' },
  { symbol: 'IWM', label: 'Russell 2000', tag: 'RSIXAF' },
  { symbol: 'VXX', label: 'VIX', tag: 'Tesla' }, // Simulated mix for image look
];

const fmt = (n, d = 2) => n == null ? '---' : Number(n).toFixed(d);

const buildAreaData = (candles) => {
  if (!candles || candles.s !== 'ok' || !candles.t?.length) return null;
  return candles.t.map((t, i) => ({
    time: t,
    value: candles.c[i],
  })).filter(d => d.value != null);
};

const AreaChart = memo(({ candles, isUp, onCrosshair }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const resizeObs = useRef(null);

  const col = isUp ? '#2ef08a' : '#ff3e3e';
  const colFade = 'rgba(0,0,0,0)';

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 240,
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(255,255,255,0.2)', style: 3 },
        horzLine: { color: 'rgba(255,255,255,0.2)', style: 3 },
      },
      rightPriceScale: {
        visible: true,
        borderColor: 'rgba(255,255,255,0.05)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: true,
      },
    });

    chartRef.current = chart;
    seriesRef.current = chart.addSeries(AreaSeries, {
      lineColor: col,
      topColor: col.replace(')', ',0.2)').replace('rgb', 'rgba'),
      bottomColor: colFade,
      lineWidth: 2,
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !seriesRef.current) { onCrosshair(null); return; }
      const pt = param.seriesData.get(seriesRef.current);
      onCrosshair(pt ? { value: pt.value, time: param.time } : null);
    });

    resizeObs.current = new ResizeObserver(entries => {
      for (const e of entries) {
        chart.resize(e.contentRect.width, 240);
      }
    });
    resizeObs.current.observe(containerRef.current);

    return () => {
      resizeObs.current?.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({
      lineColor: col,
      topColor: isUp ? 'rgba(46, 240, 138, 0.2)' : 'rgba(255, 62, 62, 0.2)',
    });
  }, [isUp, col]);

  useEffect(() => {
    const data = buildAreaData(candles);
    if (!data || !seriesRef.current) return;
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: 240 }} />;
});

export default function Market_Overview_Dash() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [quotes, setQuotes] = useState({});
  const [candlesMap, setCandlesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [crosshair, setCrosshair] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, forceTick] = useState(0);

  const formatRelativeUpdate = useCallback((timestamp) => {
    if (!timestamp) return 'Just now';
    const elapsedMinutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
    return `Updated at ${timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }, []);

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
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 60_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  useEffect(() => {
    const iv = setInterval(() => forceTick((current) => current + 1), 60_000);
    return () => clearInterval(iv);
  }, []);

  const active = INDICES[activeIdx];
  const quote = quotes[active?.symbol];
  const cdata = candlesMap[active?.symbol];
  const isUp = quote ? (quote.dp ?? 0) >= 0 : true;

  return (
    <div className="market-overview-redesign">
      {/* Global Activity Strip */}
      <div className="global-activity-redesign mb-4">
        <div className="activity-item-redesign">
          <span className="activity-label-redesign">Primary Indices</span>
          <div className="activity-value-redesign d-flex gap-3">
            <span className="text-success">SENSEX: 72,506.14 (+0.84%)</span>
            <span className="text-success">NIFTY 50: 21,894.55 (+0.63%)</span>
          </div>
          <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.35rem' }}>
            Updated {formatRelativeUpdate(lastUpdated)} · Auto-refreshes every 60s
          </div>
        </div>
        <div className="activity-item-redesign ms-4 border-start ps-4" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
          <span className="activity-label-redesign">Session Overview</span>
          <p className="mb-0 text-muted" style={{ fontSize: '0.75rem', maxWidth: '500px' }}>
            Markets continue to show bullish bias today with strong rallies in tech stocks. Domestic indices are outperforming peers.
          </p>
        </div>
      </div>

      <div className="market-card-redesign">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold" style={{ fontSize: '1.25rem' }}>
            <span style={{ color: 'var(--dash-primary)' }}>›</span> Market Summary
          </h5>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>11:22:41</span>
        </div>

        {/* Tabs for Indices */}
        <div className="market-tabs-redesign">
          {INDICES.map((idx, i) => {
            const q = quotes[idx.symbol];
            const up = q ? (q.dp ?? 0) >= 0 : true;
            return (
              <button
                key={idx.symbol}
                className={`market-tab-btn ${activeIdx === i ? 'active' : ''}`}
                onClick={() => setActiveIdx(i)}
              >
                <div className="d-flex flex-column align-items-start">
                  <span className="fw-semibold">{idx.tag}</span>
                  {q && (
                    <span style={{ fontSize: '0.7rem', color: up ? 'var(--dash-accent-green)' : 'var(--dash-accent-red)' }}>
                      {up ? '+' : ''}{fmt(q.dp)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Index Details */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{
            width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            🏢
          </div>
          <div>
            <h4 className="mb-0 fw-bold">{active.label} <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '5px' }}>LEV</span> 🚩</h4>
            <div className="d-flex align-items-center gap-2">
              <span className="fs-3 fw-bold">{quote ? fmt(quote.c) : '---'}</span>
              <span className={isUp ? 'text-success' : 'text-danger'}>
                {isUp ? '▲' : '▼'} {quote ? fmt(quote.d) : ''} ({quote ? fmt(quote.dp) : ''}%)
              </span>
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="chart-container" style={{ position: 'relative' }}>
          {cdata && (
            <AreaChart
              key={active.symbol}
              candles={cdata}
              isUp={isUp}
              onCrosshair={setCrosshair}
            />
          )}

          {/* OHLC Mini Strip */}
          {quote && (
            <div className="footer-indices-redesign mt-4">
              <div className="index-pill-redesign">O: {fmt(quote.o)}</div>
              <div className="index-pill-redesign">H: {fmt(quote.h)}</div>
              <div className="index-pill-redesign">L: {fmt(quote.l)}</div>
              <div className="index-pill-redesign">C: {fmt(quote.pc)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Ticker bar at bottom of summary */}
    </div>
  );
}

import React, { useEffect, useState, memo } from 'react';
import { getMarketSnapshotData, getVixClassification } from '../services/marketDataService';
import './MarketSnapshot.css';

const MetricBlock = memo(({ label, value, change, isPct = true, subValue = null, subValueClass = '' }) => {
  const isPositive = typeof change === 'number' && change >= 0;
  const hasChange = typeof change === 'number';
  const changeFormatted = hasChange ? `${isPositive ? '+' : ''}${change.toFixed(2)}${isPct ? '%' : ''}` : '---';

  return (
    <div className="metric-block">
      <span className="metric-label">{label}</span>
      <div className="metric-value-container">
        <span className="metric-value">{value || '---'}</span>
        {change !== null && (
          <span className={`metric-change ${isPositive ? 'change-up' : 'change-down'}`}>
            {changeFormatted}
          </span>
        )}
      </div>
      {subValue && <span className={`metric-subvalue ${subValueClass}`} style={{ fontSize: '11px', marginTop: '2px' }}>{subValue}</span>}
    </div>
  );
});

export default function Market_Overview_Dash() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch watchlist from localStorage to calculate alpha
      const savedWatchlist = localStorage.getItem('watchlist');
      const symbols = savedWatchlist ? JSON.parse(savedWatchlist).map(s => s.symbol) : [];

      const snapshot = await getMarketSnapshotData(symbols);
      setData(snapshot);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Pulse every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="market-snapshot-bar justify-content-center">
        <span className="text-muted small">Synchronizing Market Data...</span>
      </div>
    );
  }

  if (!data || data.error) return null;

  const vixClass = data.vix ? getVixClassification(data.vix.c) : { label: '---', class: '' };

  return (
    <div className="market-snapshot-wrapper">
      {data.rateLimited && (
        <div className="api-warning">
          Limited by API tier — showing partial data. Real-time updates may be throttled.
        </div>
      )}

      <div className="market-snapshot-bar">
        {/* Indices */}
        <MetricBlock
          label="NIFTY 50"
          value={data.nifty?.c?.toLocaleString()}
          change={data.nifty?.dp}
        />

        <MetricBlock
          label="SENSEX"
          value={data.sensex?.c?.toLocaleString()}
          change={data.sensex?.dp}
        />

        {/* Volatility */}
        <MetricBlock
          label="India VIX"
          value={data.vix?.c != null ? data.vix.c.toFixed(2) : '---'}
          change={data.vix?.dp}
          subValue={vixClass.label}
          subValueClass={vixClass.class}
        />

        {/* Market Breadth */}
        <div className="metric-block">
          <span className="metric-label">Market Breadth</span>
          <div className="metric-value-container">
            <span className="metric-value" style={{ fontSize: '12px' }}>
              <span className="change-up">{data.breadth.advancers}</span>
              <span className="text-muted mx-1">/</span>
              <span className="change-down">{data.breadth.decliners}</span>
            </span>
            <span className="metric-change text-muted" style={{ fontSize: '10px' }}>
              {data.breadth.total} Active
            </span>
          </div>
          <div className="progress mt-1" style={{ height: '2px', background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${(data.breadth.advancers / data.breadth.total) * 100}%` }}
            ></div>
            <div
              className="progress-bar bg-danger"
              style={{ width: `${(data.breadth.decliners / data.breadth.total) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Momentum & Alpha */}
        <MetricBlock
          label="Watchlist Alpha"
          value={data.watchlistAlpha?.alpha != null ? `${data.watchlistAlpha.alpha.toFixed(2)}%` : '---'}
          change={data.watchlistAlpha?.avgChange}
          subValue={data.watchlistAlpha?.label || 'No symbols tracked'}
          subValueClass={data.watchlistAlpha?.alpha >= 0 ? 'text-success' : 'text-danger'}
        />

        {/* Session Overview (Full Width) */}
        <div className="metric-block session-overview">
          <span className="metric-label">Session Activity</span>
          <p className="overview-text mb-0">
            {data.overview}
          </p>
        </div>
      </div>
    </div>
  );
}

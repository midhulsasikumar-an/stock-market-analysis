import React from 'react';

/**
 * Hero_Dash - Redesigned for a professional, data-centric intelligence strip
 */
export default function Hero_Dash() {
  return (
    <div className="text-white pt-2 pb-4">
      <div className="container">

        {/* Improved Greeting Hierarchy */}
        <div className="text-center mb-5 welcome-muted">
          <h2 className="fw-bold display-6">Welcome Back 👋</h2>
          <p className="welcome-subtitle mb-0">
            Real-time market intelligence and portfolio insights.
          </p>
        </div>

        {/* Market Intelligence Panel */}
        <div className="metrics-panel bg-glass">
          {/* Top Analytics Strip */}
          <div className="metrics-strip">
            <div className="metric-item">
              <span className="metric-label">Session Activity</span>
              <span className="metric-value text-info">Moderate Momentum</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Market Breadth</span>
              <div className="metric-value d-flex gap-2">
                <span className="text-success">↑ 42</span>
                <span className="opacity-25">|</span>
                <span className="text-danger">↓ 18</span>
              </div>
            </div>
            <div className="metric-item">
              <span className="metric-label">Volatility (VIX)</span>
              <span className="metric-value text-warning">14.12 (+1.4%)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Watchlist Alpha</span>
              <span className="metric-value text-success">+2.84% Avg</span>
            </div>
          </div>

          {/* Detailed Market Segment Table */}
          <div className="p-4">
            <div className="row g-4">
              <div className="col-lg-6">
                <h6 className="text-muted text-xs text-uppercase fw-bold mb-3 letter-spacing-wide">Primary Indices</h6>
                <table className="market-summary-table">
                  <tbody>
                    <tr>
                      <td className="summary-index-name text-nowrap">SENSEX (BSE)</td>
                      <td className="summary-index-value text-success">72,506.14</td>
                      <td className="text-success text-end">+0.84%</td>
                    </tr>
                    <tr>
                      <td className="summary-index-name text-nowrap">NIFTY 50 (NSE)</td>
                      <td className="summary-index-value text-success">21,894.55</td>
                      <td className="text-success text-end">+0.63%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-lg-6">
                <h6 className="text-muted text-xs text-uppercase fw-bold mb-3 letter-spacing-wide">Session Overview</h6>
                <p className="text-xs text-muted mb-0 mt-3" style={{ lineHeight: '1.6' }}>
                  Market data confirms stable volatility with strong institutional participation.
                  Domestic indices are outperforming global peers in the current session.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

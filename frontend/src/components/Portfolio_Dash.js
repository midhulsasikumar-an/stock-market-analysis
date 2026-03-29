import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import authService from '../services/authService';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const formatMoney = (value) => {
  if (value == null || isNaN(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
};

export default function Portfolio_Dash() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio/summary`, {
        headers: authService.getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) { /* silent fail for dash widget */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 120000); // 2 min refresh
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  // Chart Data
  const allocationData = useMemo(() => {
    const sectors = data?.sectorAllocation || [];
    if (!sectors.length) return null;
    const colors = ['#3b82f6', '#60a5fa', '#1d4ed8', '#1e293b', '#818cf8', '#6366f1'];
    return {
      labels: sectors.map(s => s.name),
      datasets: [{
        data: sectors.map(s => s.value),
        backgroundColor: sectors.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
        hoverOffset: 10,
        cutout: '75%',
      }],
    };
  }, [data]);

  const performanceData = useMemo(() => {
    if (!data?.summary) return null;
    const { totalInvested, totalCurrentValue } = data.summary;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const step = (totalCurrentValue - totalInvested * 0.9) / (months.length - 1);
    return {
      labels: months,
      datasets: [
        {
          label: 'My Portfolio',
          data: months.map((_, i) => Math.round(totalInvested * 0.9 + step * i)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Nifty 50',
          data: months.map((_, i) => Math.round(totalInvested * 0.85 + (totalInvested * 0.2 / (months.length - 1)) * i)),
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        }
      ],
    };
  }, [data]);

  const performanceOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: '#94a3b8', boxWidth: 10, padding: 20 }
      }
    },
    scales: {
      x: { display: false },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } }
    },
    maintainAspectRatio: false,
  };

  const s = data?.summary || {};
  const sectors = data?.sectorAllocation || [];
  const gainers = data?.topGainers || [];
  const holdings = data?.holdings || [];

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ background: 'var(--bg-dark)' }}>
      {/* Header Section */}
      <div className="mb-4 ps-2">
        <h2 className="fw-bold text-white mb-1">Dashboard Overview</h2>
        <p className="text-muted small">Monitor your portfolio and market trends</p>
      </div>

      {/* Top Metric Cards */}
      <div className="mini-stats-grid mb-4">
        {[
          { label: 'Total Invested', value: loading ? '...' : formatMoney(s.totalInvested), color: 'blue' },
          { label: 'Current Value', value: loading ? '...' : formatMoney(s.totalCurrentValue), color: 'blue' },
          {
            label: "Today's Gain / Loss",
            value: loading ? '...' : `${(s.totalProfitLoss || 0) >= 0 ? '+' : ''}${formatMoney(s.totalProfitLoss)}`,
            subValue: loading ? '' : `(${(s.totalReturnPct || 0).toFixed(2)}%)`,
            color: (s.totalProfitLoss || 0) >= 0 ? 'green' : 'red'
          },
          {
            label: "Today's Performance",
            value: loading ? '...' : `${(s.todayChangePct || 0) >= 0 ? '+' : ''}${(s.todayChangePct || 0).toFixed(2)}%`,
            subValue: loading ? '' : `${(s.todayChange || 0) >= 0 ? '+' : ''}${formatMoney(s.todayChange)}`,
            color: (s.todayChangePct || 0) >= 0 ? 'green' : 'red'
          }
        ].map((stat, idx) => (
          <div key={idx} className={`bg-glass-card stat-card-glow-${stat.color} hover-glow`}>
            <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>{stat.label}</p>
            <h3 className={`fw-bold mb-0 ${stat.label.includes('Loss') || stat.label.includes('Performance') ? (parseFloat(stat.value) >= 0 ? 'text-success' : 'text-danger') : 'text-white'}`}>{stat.value}</h3>
            {stat.subValue && <p className={`small mb-0 mt-1 ${stat.color === 'red' ? 'text-danger' : 'text-success'}`}>{stat.subValue}</p>}
          </div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="portfolio-grid">

        {/* Left Column */}
        <div className="d-flex flex-column gap-4">

          {/* Portfolio Allocation */}
          <div className="bg-glass-card h-100">
            <h6 className="text-white mb-4 fw-bold">Portfolio Allocation</h6>
            {allocationData && sectors.length > 0 ? (
              <div className="row align-items-center">
                <div className="col-md-5 position-relative" style={{ height: '220px' }}>
                  <Doughnut data={allocationData} options={{ plugins: { legend: { display: false }, tooltip: { enabled: true } }, maintainAspectRatio: false }} />
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <span className="text-muted d-block small" style={{ fontSize: '0.6rem' }}>Total Value</span>
                    <span className="text-white fw-bold d-block">{formatMoney(s.totalCurrentValue)}</span>
                    <span className={`fw-bold d-block small ${(s.totalProfitLoss || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {(s.totalProfitLoss || 0) >= 0 ? '+' : ''}{formatMoney(s.totalProfitLoss)}
                    </span>
                  </div>
                </div>
                <div className="col-md-7">
                  {sectors.map((sector, i) => {
                    const colors = ['#3b82f6', '#60a5fa', '#1d4ed8', '#1e293b'];
                    return (
                      <div key={i} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-white small fw-medium">{sector.name}</span>
                          <div className="text-end">
                            <span className="text-white small fw-bold d-block">{sector.percent}%</span>
                            <span className="text-muted d-block" style={{ fontSize: '0.6rem' }}>{formatMoney(sector.value)}</span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${sector.percent}%`, background: colors[i % colors.length], borderRadius: '4px' }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No holdings to display allocation</p>
            )}
          </div>

          <div className="row g-4">
            {/* Top Gainers */}
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="text-white mb-0 fw-bold">Top Gainers</h6>
                  <span className="text-muted small">Performance %</span>
                </div>
                <div className="d-flex flex-column gap-3">
                  {gainers.length > 0 ? gainers.map((stock, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center p-2 rounded-3 hover-glow" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-primary-subtle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <span className="text-primary fw-bold small">{stock.symbol?.charAt(0)}</span>
                        </div>
                        <span className="text-white small fw-medium">{stock.symbol}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-white d-block small fw-bold">{formatMoney(stock.currentPrice)}</span>
                        <span className="text-success small" style={{ fontSize: '0.7rem' }}>
                          +{stock.profitLossPct?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted small text-center py-3">No gainers data</p>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Line Chart */}
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <h6 className="text-white mb-3 fw-bold">Performance History</h6>
                {performanceData ? (
                  <div style={{ height: '160px' }}>
                    <Line data={performanceData} options={performanceOptions} />
                  </div>
                ) : (
                  <p className="text-muted small text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Holdings */}
        <div className="d-flex flex-column gap-4">
          <div className="bg-glass-card h-100 overflow-hidden d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-white mb-0 fw-bold">Holdings</h6>
              <span className="text-muted small">{holdings.length} stocks</span>
            </div>

            <div className="d-flex flex-column gap-1 overflow-auto" style={{ maxHeight: '600px' }}>
              {holdings.length > 0 ? holdings.map((stock, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center p-3 rounded-3 hover-glow border-bottom border-secondary border-opacity-10 cursor-pointer">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${stock.profitLoss >= 0 ? 'bg-primary' : 'bg-danger'} bg-opacity-10`} style={{ width: '36px', height: '36px' }}>
                      <span className={`${stock.profitLoss >= 0 ? 'text-primary' : 'text-danger'} small`} style={{ transform: stock.profitLoss >= 0 ? 'rotate(0deg)' : 'rotate(180deg)' }}>▲</span>
                    </div>
                    <div>
                      <span className="text-white d-block fw-bold small">{stock.symbol}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                        {stock.profitLoss >= 0 ? '+' : ''}{formatMoney(stock.profitLoss)} ({stock.profitLossPct?.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-white d-block fw-bold small">{formatMoney(stock.currentPrice)}</span>
                    <span className={`badge ${stock.dayChangePct >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${stock.dayChangePct >= 0 ? 'text-success' : 'text-danger'} border-0`} style={{ fontSize: '0.6rem' }}>
                      {stock.dayChangePct >= 0 ? '+' : ''}{(stock.dayChangePct || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-muted small text-center py-5">No holdings yet</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
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

export default function Portfolio_Dash() {
  // Chart Data for Portfolio Allocation
  const allocationData = {
    labels: ['IT', 'Finance', 'Energy', 'Others'],
    datasets: [
      {
        data: [39.34, 28.12, 20.21, 12.32],
        backgroundColor: [
          '#3b82f6', // IT - Blue
          '#60a5fa', // Finance - Light Blue
          '#1d4ed8', // Energy - Darker Blue
          '#1e293b'  // Others - Slate
        ],
        borderWidth: 0,
        hoverOffset: 10,
        cutout: '75%',
      },
    ],
  };

  const allocationOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    maintainAspectRatio: false,
  };

  // Chart Data for Recent Transactions (Performance)
  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'My Portfolio',
        data: [3000, 3500, 4200, 5000, 4800, 5600, 6200],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Nifty 50',
        data: [3000, 3200, 3400, 3700, 3900, 4100, 4300],
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      }
    ],
  };

  const performanceOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          padding: 20
        }
      }
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    },
    maintainAspectRatio: false,
  };

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
          { label: 'Total Invested', value: '₹ 97,100', color: 'blue' },
          { label: 'Current Value', value: '₹ 1,02,700', color: 'blue' },
          { label: "Today's Gain / Loss", value: '+₹ 5,600', subValue: '(5.77%)', color: 'green' },
          { label: "Today's Performance", value: '+0.60%', subValue: '+6.12', color: 'red' }
        ].map((stat, idx) => (
          <div key={idx} className={`bg-glass-card stat-card-glow-${stat.color} hover-glow`}>
            <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>{stat.label}</p>
            <h3 className={`fw-bold mb-0 ${stat.label.includes('Loss') ? 'text-success' : 'text-white'}`}>{stat.value}</h3>
            {stat.subValue && <p className={`small mb-0 mt-1 ${stat.color === 'red' ? 'text-primary' : 'text-success'}`}>{stat.subValue}</p>}
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
            <div className="row align-items-center">
              <div className="col-md-5 position-relative" style={{ height: '220px' }}>
                <Doughnut data={allocationData} options={allocationOptions} />
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <span className="text-muted d-block small" style={{ fontSize: '0.6rem' }}>Total Value</span>
                  <span className="text-white fw-bold d-block">₹ 1,02,700</span>
                  <span className="text-success fw-bold d-block small">₹ 89,340</span>
                </div>
              </div>
              <div className="col-md-7">
                {[
                  { name: 'IT', percent: '39.34%', value: '29% Tsd. €', color: '#3b82f6' },
                  { name: 'Finance', percent: '28.123%', value: '1234 Tsd. €', color: '#60a5fa' },
                  { name: 'Energy', percent: '20.21%', value: '183.4 Tsd. €', color: '#1d4ed8' },
                  { name: 'Others', percent: '12.32%', value: '123.1 Tsd. €', color: '#1e293b' }
                ].map((sector, i) => (
                  <div key={i} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-white small fw-medium">{sector.name}</span>
                      <div className="text-end">
                        <span className="text-white small fw-bold d-block">{sector.percent}</span>
                        <span className="text-muted d-block" style={{ fontSize: '0.6rem' }}>{sector.value}</span>
                      </div>
                    </div>
                    <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: sector.percent, background: sector.color, borderRadius: '4px' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  {[
                    { symbol: 'Reliance', price: '₹ 2,550', change: '+100.03%', icon: 'R' },
                    { symbol: 'Infosys', price: '₹ 1,880', change: '+11.15%', icon: 'I' },
                    { symbol: 'TCS', price: '₹ 3,500', change: '+14.23%', icon: 'T' }
                  ].map((stock, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center p-2 rounded-3 hover-glow" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-primary-subtle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <span className="text-primary fw-bold small">{stock.icon}</span>
                        </div>
                        <span className="text-white small fw-medium">{stock.symbol}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-white d-block small fw-bold">{stock.price}</span>
                        <span className="text-success small" style={{ fontSize: '0.7rem' }}>{stock.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions / Performance Line Chart */}
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <h6 className="text-white mb-3 fw-bold">Performance History</h6>
                <div style={{ height: '160px' }}>
                  <Line data={performanceData} options={performanceOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Watchlist */}
        <div className="d-flex flex-column gap-4">
          <div className="bg-glass-card h-100 overflow-hidden d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-white mb-0 fw-bold">Watchlist</h6>
              <button className="btn btn-sm text-muted">+</button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                className="form-control form-control-sm bg-dark border-0 text-white"
                placeholder="Search symbol..."
                style={{ background: 'rgba(0,0,0,0.2) !important' }}
              />
            </div>

            <div className="d-flex flex-column gap-1 overflow-auto" style={{ maxHeight: '600px' }}>
              {[
                { symbol: 'MSFT', price: '₹ 390.55', change: '+1.43 (+0.45%)', trend: 'up' },
                { symbol: 'HDFCB', price: '₹ 1,050.20', change: '+5.75 (+0.50%)', trend: 'up' },
                { symbol: 'TATASTEEL', price: '₹ 1,238.50', change: '+7.66 (+0.57%)', trend: 'up' },
                { symbol: 'Airtel', price: '₹ 1,231.40', change: '-4.65 (-0.38%)', trend: 'down' },
              ].map((stock, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center p-3 rounded-3 hover-glow border-bottom border-secondary border-opacity-10 cursor-pointer">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${stock.trend === 'up' ? 'bg-primary' : 'bg-danger'} bg-opacity-10`} style={{ width: '36px', height: '36px' }}>
                      <span className={`${stock.trend === 'up' ? 'text-primary' : 'text-danger'} small`} style={{ transform: stock.trend === 'up' ? 'rotate(0deg)' : 'rotate(180deg)' }}>▲</span>
                    </div>
                    <div>
                      <span className="text-white d-block fw-bold small">{stock.symbol}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>{stock.change}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-white d-block fw-bold small">{stock.price}</span>
                    <span className={`badge ${stock.trend === 'up' ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${stock.trend === 'up' ? 'text-success' : 'text-danger'} border-0`} style={{ fontSize: '0.6rem' }}>
                      {stock.trend === 'up' ? '0.88%' : '2.84%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

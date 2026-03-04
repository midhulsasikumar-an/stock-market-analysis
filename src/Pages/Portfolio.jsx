import React, { useMemo } from 'react';
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

const holdings = [
  { stock: 'Reliance', ticker: 'RELI', qty: 10, avgPrice: 2400, currentPrice: 2550, sector: 'Energy' },
  { stock: 'Infosys', ticker: 'INFY', qty: 15, avgPrice: 1700, currentPrice: 1880, sector: 'IT' },
  { stock: 'HDFC Bank', ticker: 'HDFCB', qty: 20, avgPrice: 1100, currentPrice: 1050, sector: 'Finance' },
  { stock: 'TCS', ticker: 'TCS', qty: 8, avgPrice: 3200, currentPrice: 3500, sector: 'IT' },
];

const transactions = [
  { date: '12 Apr', type: 'Buy', stock: 'TCS', quantity: 5, price: 3400 },
  { date: '05 Apr', type: 'Sell', stock: 'INFY', quantity: 10, price: 1850 },
];

const formatMoney = (value) => `₹ ${Math.round(value).toLocaleString('en-IN')}`;

export default function Portfolio() {
  const computed = useMemo(() => {
    const rows = holdings.map((h) => {
      const invested = h.qty * h.avgPrice;
      const current = h.qty * h.currentPrice;
      const pl = current - invested;
      const returnPct = invested > 0 ? (pl / invested) * 100 : 0;
      return { ...h, invested, current, pl, returnPct };
    });

    const totalInvested = rows.reduce((sum, r) => sum + r.invested, 0);
    const currentValue = rows.reduce((sum, r) => sum + r.current, 0);
    const totalPL = currentValue - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    // Group by sector
    const sectorTotals = rows.reduce((acc, r) => {
      acc[r.sector] = (acc[r.sector] || 0) + r.current;
      return acc;
    }, {});

    const sectorData = Object.keys(sectorTotals).map(sector => ({
      name: sector,
      value: sectorTotals[sector],
      percent: ((sectorTotals[sector] / currentValue) * 100).toFixed(2)
    }));

    return {
      rows,
      totalInvested,
      currentValue,
      totalPL,
      totalReturnPct,
      sectorData
    };
  }, []);

  const allocationData = {
    labels: computed.sectorData.map(s => s.name),
    datasets: [
      {
        data: computed.sectorData.map(s => s.value),
        backgroundColor: ['#3b82f6', '#60a5fa', '#1d4ed8', '#1e293b'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'My Portfolio',
        data: [computed.totalInvested * 0.9, computed.totalInvested * 0.95, computed.totalInvested, computed.currentValue * 0.98, computed.currentValue],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Nifty 50',
        data: [computed.totalInvested * 0.85, computed.totalInvested * 0.9, computed.totalInvested * 0.95, computed.totalInvested * 0.98, computed.totalInvested * 1.05],
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      }
    ],
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ background: 'var(--bg-dark)' }}>
      <div className="mb-4 ps-2">
        <h2 className="fw-bold text-white mb-1">Portfolio Overview</h2>
        <p className="text-muted small">Manage your assets and track performance</p>
      </div>

      <div className="mini-stats-grid mb-4">
        <div className="bg-glass-card stat-card-glow-blue hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Total Invested</p>
          <h3 className="fw-bold text-white mb-0">{formatMoney(computed.totalInvested)}</h3>
        </div>
        <div className="bg-glass-card stat-card-glow-blue hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Current Value</p>
          <h3 className="fw-bold text-white mb-0">{formatMoney(computed.currentValue)}</h3>
        </div>
        <div className="bg-glass-card stat-card-glow-green hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Total Gain / Loss</p>
          <h3 className={`fw-bold mb-0 ${computed.totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatMoney(computed.totalPL)}
          </h3>
          <p className={`small mb-0 mt-1 ${computed.totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
            {computed.totalReturnPct.toFixed(2)}%
          </p>
        </div>
        <div className="bg-glass-card stat-card-glow-blue hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Holdings</p>
          <h3 className="fw-bold text-white mb-0">{computed.rows.length} Stocks</h3>
        </div>
      </div>

      <div className="portfolio-grid">
        <div className="d-flex flex-column gap-4">
          {/* Allocation */}
          <div className="bg-glass-card">
            <h6 className="text-white mb-4 fw-bold">Portfolio Allocation</h6>
            <div className="row align-items-center">
              <div className="col-md-5 position-relative" style={{ height: '220px' }}>
                <Doughnut data={allocationData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <span className="text-muted d-block small" style={{ fontSize: '0.6rem' }}>Total</span>
                  <span className="text-white fw-bold d-block">{formatMoney(computed.currentValue)}</span>
                </div>
              </div>
              <div className="col-md-7">
                {computed.sectorData.map((sector, i) => (
                  <div key={i} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-white small fw-medium">{sector.name}</span>
                      <span className="text-white small fw-bold">{sector.percent}%</span>
                    </div>
                    <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                      <div className="progress-bar bg-primary" style={{ width: `${sector.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <h6 className="text-white mb-3 fw-bold">Recent Transactions</h6>
                <div className="d-flex flex-column gap-2">
                  {transactions.map((tx, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <span className="text-white d-block small fw-bold">{tx.stock}</span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>{tx.date} • {tx.type}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-white d-block small">{formatMoney(tx.price)}</span>
                        <span className="text-muted small" style={{ fontSize: '0.65rem' }}>Qty: {tx.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <h6 className="text-white mb-3 fw-bold">Performance History</h6>
                <div style={{ height: '160px' }}>
                  <Line data={performanceData} options={{ plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } }, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-column gap-4">
          <div className="bg-glass-card h-100 overflow-hidden d-flex flex-column">
            <h6 className="text-white mb-3 fw-bold">Current Holdings</h6>
            <div className="d-flex flex-column gap-1 overflow-auto">
              {computed.rows.map((row, i) => (
                <div key={i} className="p-3 rounded-3 hover-glow border-bottom border-secondary border-opacity-10">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-white fw-bold small">{row.stock}</span>
                    <span className="text-white small fw-bold">{formatMoney(row.current)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>{row.qty} Shares @ {formatMoney(row.avgPrice)}</span>
                    <span className={`small ${row.pl >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {row.returnPct >= 0 ? '+' : ''}{row.returnPct.toFixed(2)}%
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

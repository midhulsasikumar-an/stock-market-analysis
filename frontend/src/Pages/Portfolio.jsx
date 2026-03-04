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
  if (value == null || isNaN(value)) return '$ 0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  return `${sign}$ ${Math.round(abs).toLocaleString('en-US')}`;
};

export default function Portfolio() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ─── Add Holding Modal State ──────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', name: '', quantity: '', avgBuyPrice: '', sector: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/portfolio/summary`, {
        headers: authService.getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setPortfolioData(data.data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(data.message || "Failed to load portfolio");
      }
    } catch (err) {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 60s polling for live prices
  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 60000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  // ─── Add holding handler ──────────────────────────────────────────────────
  const handleAddHolding = async (e) => {
    e.preventDefault();
    if (!addForm.symbol || !addForm.quantity || !addForm.avgBuyPrice) return;
    setAddLoading(true);
    try {
      const portfolioId = portfolioData?.portfolio?._id;
      if (!portfolioId) {
        // Create default portfolio first
        const createRes = await fetch(`${API_URL}/api/portfolio`, {
          method: 'POST',
          headers: authService.getAuthHeaders(),
          body: JSON.stringify({ name: 'My Portfolio', isDefault: true })
        });
        const created = await createRes.json();
        if (!created.success) throw new Error("Failed to create portfolio");
      }
      const pid = portfolioId || (await (await fetch(`${API_URL}/api/portfolio`, { headers: authService.getAuthHeaders() })).json()).data[0]?._id;

      const res = await fetch(`${API_URL}/api/portfolio/${pid}/holding`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          symbol: addForm.symbol.toUpperCase(),
          name: addForm.name || addForm.symbol.toUpperCase(),
          quantity: Number(addForm.quantity),
          avgBuyPrice: Number(addForm.avgBuyPrice),
          sector: addForm.sector || 'Other'
        })
      });
      const result = await res.json();
      if (result.success) {
        setShowAddModal(false);
        setAddForm({ symbol: '', name: '', quantity: '', avgBuyPrice: '', sector: '' });
        fetchPortfolio(); // Refresh
      } else {
        alert(result.message || "Failed to add holding");
      }
    } catch (err) {
      alert("Error adding holding: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // ─── Computed chart data ──────────────────────────────────────────────────
  const computed = useMemo(() => {
    if (!portfolioData) return null;
    const { summary, holdings, sectorAllocation, topGainers, recentTransactions } = portfolioData;
    return { summary, holdings, sectorAllocation, topGainers, recentTransactions };
  }, [portfolioData]);

  const allocationData = useMemo(() => {
    if (!computed?.sectorAllocation?.length) return null;
    const colors = ['#3b82f6', '#60a5fa', '#1d4ed8', '#818cf8', '#6366f1', '#a78bfa', '#1e293b'];
    return {
      labels: computed.sectorAllocation.map(s => s.name),
      datasets: [{
        data: computed.sectorAllocation.map(s => s.value),
        backgroundColor: computed.sectorAllocation.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
        cutout: '75%',
      }],
    };
  }, [computed]);

  const performanceData = useMemo(() => {
    if (!computed?.summary) return null;
    const { totalInvested, totalCurrentValue } = computed.summary;
    // Generate synthetic performance curve from invested → current
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const step = (totalCurrentValue - totalInvested * 0.9) / (months.length - 1);
    const portfolioLine = months.map((_, i) => Math.round(totalInvested * 0.9 + step * i));
    const benchmarkLine = months.map((_, i) => Math.round(totalInvested * 0.85 + (totalInvested * 0.2 / (months.length - 1)) * i));

    return {
      labels: months,
      datasets: [
        {
          label: 'My Portfolio',
          data: portfolioLine,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Benchmark',
          data: benchmarkLine,
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        }
      ],
    };
  }, [computed]);

  // ─── Loading/Error States ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container-fluid py-4 min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error && !portfolioData) {
    return (
      <div className="container-fluid py-4 min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center">
          <p className="text-danger mb-3">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchPortfolio}>Retry</button>
        </div>
      </div>
    );
  }

  const s = computed?.summary || {};
  const holdings = computed?.holdings || [];
  const sectors = computed?.sectorAllocation || [];
  const gainers = computed?.topGainers || [];
  const txns = computed?.recentTransactions || [];

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ background: 'var(--bg-dark)' }}>
      <div className="mb-4 ps-2 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold text-white mb-1">Portfolio Overview</h2>
          <p className="text-muted small mb-0">
            Manage your assets and track performance
            {lastUpdated && <span className="ms-2" style={{ fontSize: '0.6rem' }}>• Updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={fetchPortfolio} title="Refresh prices">
            🔄 Refresh
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Stock
          </button>
        </div>
      </div>

      {/* ─── Top Stat Cards ──────────────────────────────────────────── */}
      <div className="mini-stats-grid mb-4">
        <div className="bg-glass-card stat-card-glow-blue hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Total Invested</p>
          <h3 className="fw-bold text-white mb-0">{formatMoney(s.totalInvested)}</h3>
        </div>
        <div className="bg-glass-card stat-card-glow-blue hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Current Value</p>
          <h3 className="fw-bold text-white mb-0">{formatMoney(s.totalCurrentValue)}</h3>
        </div>
        <div className="bg-glass-card stat-card-glow-green hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Total Gain / Loss</p>
          <h3 className={`fw-bold mb-0 ${(s.totalProfitLoss || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatMoney(s.totalProfitLoss)}
          </h3>
          <p className={`small mb-0 mt-1 ${(s.totalProfitLoss || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
            {(s.totalReturnPct || 0).toFixed(2)}%
          </p>
        </div>
        <div className="bg-glass-card stat-card-glow-blue hover-glow">
          <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Holdings</p>
          <h3 className="fw-bold text-white mb-0">{s.holdingsCount || 0} Stocks</h3>
          {s.todayChange != null && (
            <p className={`small mb-0 mt-1 ${s.todayChange >= 0 ? 'text-success' : 'text-danger'}`}>
              Today: {s.todayChange >= 0 ? '+' : ''}{formatMoney(s.todayChange)}
            </p>
          )}
        </div>
      </div>

      {/* ─── Main Grid ───────────────────────────────────────────────── */}
      <div className="portfolio-grid">
        <div className="d-flex flex-column gap-4">
          {/* Allocation Donut */}
          <div className="bg-glass-card">
            <h6 className="text-white mb-4 fw-bold">Portfolio Allocation</h6>
            {allocationData && sectors.length > 0 ? (
              <div className="row align-items-center">
                <div className="col-md-5 position-relative" style={{ height: '220px' }}>
                  <Doughnut data={allocationData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <span className="text-muted d-block small" style={{ fontSize: '0.6rem' }}>Total</span>
                    <span className="text-white fw-bold d-block">{formatMoney(s.totalCurrentValue)}</span>
                  </div>
                </div>
                <div className="col-md-7">
                  {sectors.map((sector, i) => (
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
            ) : (
              <p className="text-muted text-center py-4">No holdings yet. Add stocks to see allocation.</p>
            )}
          </div>

          <div className="row g-4">
            {/* Recent Transactions */}
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <h6 className="text-white mb-3 fw-bold">Recent Transactions</h6>
                <div className="d-flex flex-column gap-2">
                  {txns.length > 0 ? txns.slice(0, 5).map((tx, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <span className="text-white d-block small fw-bold">{tx.symbol}</span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {new Date(tx.executedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} •
                          <span className={tx.type === 'BUY' ? ' text-success' : ' text-danger'}> {tx.type}</span>
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-white d-block small">{formatMoney(tx.totalAmount)}</span>
                        <span className="text-muted small" style={{ fontSize: '0.65rem' }}>Qty: {tx.quantity}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted small text-center py-3">No transactions yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <h6 className="text-white mb-3 fw-bold">Performance History</h6>
                {performanceData && s.totalInvested > 0 ? (
                  <div style={{ height: '160px' }}>
                    <Line data={performanceData} options={{ plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } }, maintainAspectRatio: false }} />
                  </div>
                ) : (
                  <p className="text-muted small text-center py-4">Add holdings to see performance</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Holdings List ────────────────────────────── */}
        <div className="d-flex flex-column gap-4">
          <div className="bg-glass-card h-100 overflow-hidden d-flex flex-column">
            <h6 className="text-white mb-3 fw-bold">Current Holdings</h6>
            <div className="d-flex flex-column gap-1 overflow-auto">
              {holdings.length > 0 ? holdings.map((row, i) => (
                <div key={row._id || i} className="p-3 rounded-3 hover-glow border-bottom border-secondary border-opacity-10">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div>
                      <span className="text-white fw-bold small">{row.symbol}</span>
                      {row.name && row.name !== row.symbol && (
                        <span className="text-muted ms-2" style={{ fontSize: '0.6rem' }}>{row.name}</span>
                      )}
                    </div>
                    <span className="text-white small fw-bold">{formatMoney(row.currentValue)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                      {row.quantity} Shares @ {formatMoney(row.avgBuyPrice)}
                    </span>
                    <span className={`small ${row.profitLoss >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {row.profitLossPct >= 0 ? '+' : ''}{row.profitLossPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '0.6rem' }}>
                      CMP: {formatMoney(row.currentPrice)}
                    </span>
                    <span className={`fw-bold ${row.profitLoss >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {row.profitLoss >= 0 ? '+' : ''}{formatMoney(row.profitLoss)}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-3">No holdings yet</p>
                  <button className="btn btn-sm btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add Your First Stock
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Add Holding Modal ───────────────────────────────────────── */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
          <div className="bg-glass-card p-4" style={{ width: '420px', maxWidth: '95vw', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-white fw-bold mb-0">Add Stock</h5>
              <button className="btn btn-sm text-muted" onClick={() => setShowAddModal(false)} style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleAddHolding}>
              <div className="mb-3">
                <label className="text-muted small mb-1">Symbol *</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="e.g. AAPL"
                  value={addForm.symbol} onChange={e => setAddForm(p => ({ ...p, symbol: e.target.value }))} required />
              </div>
              <div className="mb-3">
                <label className="text-muted small mb-1">Company Name</label>
                <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="e.g. Apple Inc."
                  value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="text-muted small mb-1">Quantity *</label>
                  <input type="number" className="form-control bg-dark text-white border-secondary" placeholder="10" min="0.0001" step="any"
                    value={addForm.quantity} onChange={e => setAddForm(p => ({ ...p, quantity: e.target.value }))} required />
                </div>
                <div className="col-6">
                  <label className="text-muted small mb-1">Buy Price *</label>
                  <input type="number" className="form-control bg-dark text-white border-secondary" placeholder="150.00" min="0" step="any"
                    value={addForm.avgBuyPrice} onChange={e => setAddForm(p => ({ ...p, avgBuyPrice: e.target.value }))} required />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-muted small mb-1">Sector</label>
                <select className="form-control bg-dark text-white border-secondary"
                  value={addForm.sector} onChange={e => setAddForm(p => ({ ...p, sector: e.target.value }))}>
                  <option value="">Select sector</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Energy">Energy</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Automobile">Automobile</option>
                  <option value="Telecom">Telecom</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

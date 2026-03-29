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
import toast from 'react-hot-toast';
import authService from '../services/authService';
import transactionService from '../services/transactionService';

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

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

const formatSignedMoney = (value) => {
  if (value == null || isNaN(value)) return '$0';
  const abs = Math.abs(value);
  if (value > 0) return `+$${Math.round(abs).toLocaleString('en-US')}`;
  if (value < 0) return `-$${Math.round(abs).toLocaleString('en-US')}`;
  return '$0';
};

const formatSignedPercent = (value) => {
  if (value == null || isNaN(value)) return '0.00%';
  const abs = Math.abs(value).toFixed(2);
  if (value > 0) return `+${abs}%`;
  if (value < 0) return `-${abs}%`;
  return `${abs}%`;
};

const formatCsvDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const csvEscape = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

// ─── Sell Modal ───────────────────────────────────────────────────────────────
function SellModal({ holding, onClose, onSuccess }) {
  const [form, setForm] = useState({ quantity: '', sellPrice: (holding.currentPrice || holding.avgBuyPrice || '').toString() });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [confirmFullSale, setConfirmFullSale] = useState(false);

  const maxQty = holding.quantity ?? 0;
  const total = (Number(form.quantity) || 0) * (Number(form.sellPrice) || 0);
  const buyTotal = (Number(form.quantity) || 0) * (holding.avgBuyPrice ?? 0);
  const pnl = total - buyTotal;
  const isFullSale = Number(form.quantity) > 0 && Number(form.quantity) === Number(maxQty);

  useEffect(() => {
    setConfirmFullSale(false);
  }, [form.quantity, maxQty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || !form.sellPrice) return;
    if (Number(form.quantity) > maxQty) {
      setErr(`Insufficient quantity. You hold ${maxQty} shares.`);
      return;
    }
    if (isFullSale && !confirmFullSale) {
      setErr('This will mark the holding as fully sold. Confirm to continue.');
      setConfirmFullSale(true);
      return;
    }
    setLoading(true);
    setErr('');
    const loadingId = toast.loading('Saving...');
    try {
      await transactionService.sell(holding.symbol, form.quantity, form.sellPrice);
      toast.success('Sale recorded successfully', { id: loadingId });
      onSuccess();
    } catch (er) {
      setErr(er.message || 'Failed to sell stock');
      toast.error('Something went wrong. Please try again.', { id: loadingId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}>
      <div className="bg-glass-card p-4" style={{ width: '420px', maxWidth: '95vw', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="text-white fw-bold mb-0">Sell {holding.symbol}</h5>
          <button className="btn btn-sm text-muted" onClick={onClose} style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Holding summary */}
        <div className="p-3 rounded mb-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
          <div className="d-flex justify-content-between">
            <div>
              <div className="text-white fw-bold small">{holding.symbol}</div>
              {holding.name && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{holding.name}</div>}
            </div>
            <div className="text-end">
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>Holdings</div>
              <div className="text-white small fw-bold">{maxQty} shares</div>
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>Avg: ${(holding.avgBuyPrice ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-6">
              <label className="text-muted small mb-1">Sell Price ($) *</label>
              <input
                type="number"
                className="form-control bg-dark text-white border-secondary"
                min="0" step="any"
                value={form.sellPrice}
                onChange={e => setForm(p => ({ ...p, sellPrice: e.target.value }))}
                required
              />
              <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                CMP: ${(holding.currentPrice ?? 0).toFixed(2)}
              </small>
            </div>
            <div className="col-6">
              <label className="text-muted small mb-1">Quantity *</label>
              <input
                type="number"
                className="form-control bg-dark text-white border-secondary"
                placeholder={`Max ${maxQty}`}
                min="0.0001" step="any" max={maxQty}
                value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                required
              />
              <small className="text-muted" style={{ fontSize: '0.65rem' }}>Available: {maxQty}</small>
            </div>
          </div>

          {/* P&L Preview */}
          {Number(form.quantity) > 0 && (
            <div className="mb-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">Sell Value</span>
                <span className="text-white small fw-bold">${total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">Buy Cost</span>
                <span className="text-white small">${buyTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '4px' }}>
                <span className="text-muted small">Est. P&L</span>
                <span className={`small fw-bold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {err && <div className="alert alert-danger py-2 small mb-3">{err}</div>}

          {isFullSale && confirmFullSale && (
            <div className="mb-3 p-3 rounded" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <div className="text-white fw-bold small mb-1">This will mark {holding.symbol} as fully sold in your portfolio.</div>
              <div className="text-muted small">This will delete all recorded transactions for this holding.</div>
            </div>
          )}

          <button
            type="submit"
            className="btn w-100 mt-1"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isFullSale && !confirmFullSale ? 'Continue' : `Sell ${form.quantity || '0'} shares of ${holding.symbol}`}
          </button>
          {isFullSale && confirmFullSale && (
            <div className="d-flex gap-2 mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-50"
                onClick={() => setConfirmFullSale(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn w-50"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                Yes, remove
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Transaction History Section ─────────────────────────────────────────────
function TransactionHistory({ transactions, loading }) {
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    if (filter === 'ALL') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleDownloadCsv = () => {
    if (!transactions.length) return;

    const rows = [
      ['Date', 'Stock', 'Type', 'Quantity', 'Price', 'Total'],
      ...transactions.map((tx) => [
        formatDate(tx.executedAt || tx.createdAt),
        tx.symbol || '',
        tx.type || '',
        tx.quantity ?? '',
        (tx.pricePerUnit ?? 0).toFixed(2),
        (tx.totalAmount ?? 0).toFixed(2),
      ])
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tradetrack-transactions-${formatCsvDate(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-glass-card mt-4">
      <div className="d-flex justify-content-between align-items-start mb-3 gap-3 flex-wrap">
        <h6 className="text-white fw-bold mb-0">Transaction History</h6>
        <div className="d-flex gap-2 align-items-center flex-wrap justify-content-end">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            style={{ fontSize: '0.7rem', padding: '3px 10px' }}
            onClick={handleDownloadCsv}
            disabled={!transactions.length}
          >
            Download CSV
          </button>
          <div className="d-flex gap-2">
            {['ALL', 'BUY', 'SELL'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize: '0.7rem', padding: '3px 10px' }}
                onClick={() => { setFilter(f); setPage(0); }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
        </div>
      ) : paginated.length === 0 ? (
        <p className="text-muted text-center small py-4">No transactions found</p>
      ) : (
        <>
          {/* Table Header */}
          <div className="d-flex px-2 py-1 mb-1" style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <div style={{ flex: '0 0 90px' }}>Date</div>
            <div style={{ flex: '0 0 70px' }}>Stock</div>
            <div style={{ flex: '0 0 50px' }}>Type</div>
            <div style={{ flex: 1 }}>Qty</div>
            <div style={{ flex: 1 }}>Price</div>
            <div style={{ flex: 1, textAlign: 'right' }}>Total</div>
          </div>

          <div className="d-flex flex-column gap-1">
            {paginated.map((tx, i) => (
              <div key={tx._id || i} className="d-flex align-items-center px-2 py-2 rounded-3" style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.8rem' }}>
                <div style={{ flex: '0 0 90px', color: '#64748b', fontSize: '0.7rem' }}>
                  {formatDate(tx.executedAt || tx.createdAt)}
                </div>
                <div style={{ flex: '0 0 70px', fontWeight: 700, color: '#e2e8f0' }}>
                  {tx.symbol}
                </div>
                <div style={{ flex: '0 0 50px' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: tx.type === 'BUY' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: tx.type === 'BUY' ? '#10b981' : '#ef4444'
                  }}>
                    {tx.type}
                  </span>
                </div>
                <div style={{ flex: 1, color: '#94a3b8' }}>{tx.quantity}</div>
                <div style={{ flex: 1, color: '#94a3b8' }}>${(tx.pricePerUnit || 0).toFixed(2)}</div>
                <div style={{ flex: 1, textAlign: 'right', color: '#e2e8f0', fontWeight: 600 }}>
                  ${(tx.totalAmount || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: '0.7rem' }}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                Page {page + 1} of {totalPages} · {filtered.length} transactions
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: '0.7rem' }}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── P&L Detail Table ─────────────────────────────────────────────────────────
function PnLTable({ holdings }) {
  const totalPnL = holdings.reduce((s, h) => s + h.profitLoss, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);

  if (holdings.length === 0) return null;

  const getPnlStyle = (value) => ({
    background: value > 0
      ? 'rgba(16,185,129,0.05)'
      : value < 0
        ? 'rgba(239,68,68,0.05)'
        : 'rgba(148,163,184,0.04)'
  });

  return (
    <div className="bg-glass-card mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="text-white fw-bold mb-0">Profit / Loss Breakdown</h6>
        <div className="text-end">
          <span className="text-muted" style={{ fontSize: '0.7rem' }}>Total P&L: </span>
          <span className={`fw-bold small ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalPnL >= 0 ? '+' : ''}{formatMoney(totalPnL)}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="d-flex px-2 py-1 mb-1" style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <div style={{ flex: '0 0 70px' }}>Stock</div>
        <div style={{ flex: 1 }}>Qty</div>
        <div style={{ flex: 1 }}>Avg Buy</div>
        <div style={{ flex: 1 }}>Current Price</div>
        <div style={{ flex: 1 }}>Invested</div>
        <div style={{ flex: 1 }}>Value</div>
        <div style={{ flex: 1, textAlign: 'right' }}>P&L</div>
      </div>

      <div className="d-flex flex-column gap-1">
        {holdings.map((h, i) => (
          <div key={h._id || i} className="d-flex align-items-center px-2 py-2 rounded-3" style={{ ...getPnlStyle(h.profitLoss || 0), fontSize: '0.78rem' }}>
            <div style={{ flex: '0 0 70px' }}>
              <span className="text-white fw-bold" style={{ fontSize: '0.78rem' }}>{h.symbol}</span>
            </div>
            <div style={{ flex: 1, color: '#94a3b8' }}>{h.quantity}</div>
            <div style={{ flex: 1, color: '#94a3b8' }}>${(h.avgBuyPrice || 0).toFixed(2)}</div>
            <div style={{ flex: 1, color: '#94a3b8' }}>${(h.currentPrice || 0).toFixed(2)}</div>
            <div style={{ flex: 1, color: '#94a3b8' }}>{formatMoney(h.invested)}</div>
            <div style={{ flex: 1, color: '#e2e8f0' }}>{formatMoney(h.currentValue)}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <span className={`fw-bold ${h.profitLoss > 0 ? 'text-success' : h.profitLoss < 0 ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '0.78rem' }}>
                {formatSignedMoney(h.profitLoss)}
              </span>
              <br />
              <span className={h.profitLoss > 0 ? 'text-success' : h.profitLoss < 0 ? 'text-danger' : 'text-muted'} style={{ fontSize: '0.65rem' }}>
                ({formatSignedPercent(h.profitLossPct ?? 0)})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 px-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-muted small">Total Invested: <strong className="text-white">{formatMoney(totalInvested)}</strong></span>
        <span className={`small fw-bold ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
          Unrealized P&L: {totalPnL >= 0 ? '+' : ''}{formatMoney(totalPnL)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Portfolio Component ────────────────────────────────────────────────
export default function Portfolio() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, forceTick] = useState(0);

  // Transaction history
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // Add Holding Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', name: '', quantity: '', avgBuyPrice: '', sector: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Sell Modal
  const [sellHolding, setSellHolding] = useState(null); // holding object

  const fetchPortfolio = useCallback(async (updateStamp = true) => {
    try {
      const response = await fetch(`${API_URL}/api/portfolio/summary`, {
        headers: authService.getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setPortfolioData(data.data);
        setError(null);
        if (updateStamp) setLastUpdated(new Date());
      } else {
        setError(data.message || "Failed to load portfolio");
      }
    } catch (err) {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    setTxLoading(true);
    try {
      const txs = await transactionService.getTransactions({ limit: 100 });
      setTransactions(txs);
    } catch {
      /* silent */
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio(true);
    fetchTransactions();
    const interval = setInterval(() => fetchPortfolio(false), 60000);
    return () => clearInterval(interval);
  }, [fetchPortfolio, fetchTransactions]);

  useEffect(() => {
    const interval = setInterval(() => forceTick((value) => value + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Add holding handler ──────────────────────────────────────────────────
  const handleAddHolding = async (e) => {
    e.preventDefault();
    if (!addForm.symbol || !addForm.quantity || !addForm.avgBuyPrice) return;
    setAddLoading(true);
    const loadingId = toast.loading('Saving...');
    try {
      await transactionService.buy(
        addForm.symbol,
        addForm.name || addForm.symbol.toUpperCase(),
        addForm.quantity,
        addForm.avgBuyPrice,
        addForm.sector || 'Other'
      );
      setShowAddModal(false);
      setAddForm({ symbol: '', name: '', quantity: '', avgBuyPrice: '', sector: '' });
      fetchPortfolio();
      fetchTransactions();
      toast.success('Investment logged successfully', { id: loadingId });
    } catch (err) {
      toast.error('Something went wrong. Please try again.', { id: loadingId });
    } finally {
      setAddLoading(false);
    }
  };

  // ─── Sell handler ─────────────────────────────────────────────────────────
  const handleSellSuccess = () => {
    setSellHolding(null);
    fetchPortfolio();
    fetchTransactions();
    toast.success('Sale recorded successfully');
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
    fetchPortfolio(false);
    fetchTransactions();
  };

  const formatPortfolioRefresh = (timestamp) => {
    if (!timestamp) return 'Last refreshed: pending';
    const elapsedMinutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    if (elapsedMinutes < 1) return 'Last refreshed: Just now';
    if (elapsedMinutes < 60) return `Last refreshed: ${elapsedMinutes} min ago`;
    return `Last refreshed: Updated at ${timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  // ─── Chart data ───────────────────────────────────────────────────────────
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

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ background: 'var(--bg-dark)' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-4 ps-2 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold text-white mb-1">Portfolio Overview</h2>
          <p className="text-muted small mb-0">
            Manage your assets and track performance
            {lastUpdated && <span className="ms-2" style={{ fontSize: '0.6rem' }}>• Updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={handleRefresh} title="Refreshes current prices from Finnhub API">
            🔄 Refresh
          </button>
          <span className="text-muted align-self-center" style={{ fontSize: '0.72rem' }}>
            {formatPortfolioRefresh(lastUpdated)}
          </span>
          <button className="btn btn-sm btn-primary" onClick={() => setShowAddModal(true)}>
            + Log Investment
          </button>
        </div>
      </div>

      {/* ─── Top Stat Cards ───────────────────────────────────────────────── */}
      {holdings.length > 0 ? (
        <div className="mini-stats-grid mb-4">
          <div className="bg-glass-card stat-card-glow-blue hover-glow">
            <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Total Invested</p>
            <h3 className="fw-bold text-white mb-0">{formatMoney(s.totalInvested)}</h3>
          </div>
          <div className="bg-glass-card stat-card-glow-blue hover-glow">
            <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Current Value</p>
            <h3 className="fw-bold text-white mb-0">{formatMoney(s.totalCurrentValue)}</h3>
          </div>
          <div
            className="bg-glass-card hover-glow"
            style={{
              background: (s.totalProfitLoss || 0) > 0
                ? 'linear-gradient(180deg, rgba(16,185,129,0.14), rgba(15,23,42,0.78))'
                : (s.totalProfitLoss || 0) < 0
                  ? 'linear-gradient(180deg, rgba(239,68,68,0.14), rgba(15,23,42,0.78))'
                  : 'linear-gradient(180deg, rgba(148,163,184,0.12), rgba(15,23,42,0.78))',
              border: (s.totalProfitLoss || 0) > 0
                ? '1px solid rgba(16,185,129,0.18)'
                : (s.totalProfitLoss || 0) < 0
                  ? '1px solid rgba(239,68,68,0.18)'
                  : '1px solid rgba(148,163,184,0.16)'
            }}
          >
            <p className="text-muted text-uppercase small mb-2" style={{ fontSize: '0.65rem' }}>Total Gain / Loss</p>
            <div className={`d-inline-flex align-items-center gap-2 ${(s.totalProfitLoss || 0) > 0 ? 'text-success' : (s.totalProfitLoss || 0) < 0 ? 'text-danger' : 'text-muted'}`}>
              <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: 1 }}>
                {(s.totalProfitLoss || 0) > 0 ? '▲' : (s.totalProfitLoss || 0) < 0 ? '▼' : '●'}
              </span>
              <h3 className="fw-bold mb-0" style={{ fontSize: '1.5rem' }}>
                {formatSignedMoney(s.totalProfitLoss)}
              </h3>
            </div>
            <p className={`small mb-0 mt-1 ${(s.totalProfitLoss || 0) > 0 ? 'text-success' : (s.totalProfitLoss || 0) < 0 ? 'text-danger' : 'text-muted'}`}>
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
      ) : (
        <div className="empty-state-card empty-state-card--compact mb-4">
          <div className="empty-state-icon" aria-hidden="true">📊</div>
          <h4 className="empty-state-title">No investments tracked yet</h4>
          <p className="empty-state-subtitle">
            Add your first holding to start tracking performance.
          </p>
          <button type="button" className="empty-state-button" onClick={() => setShowAddModal(true)}>
            + Log Your First Investment
          </button>
        </div>
      )}

      {/* ─── Main Grid ────────────────────────────────────────────────────── */}
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
              <div className="empty-state-row empty-state-card--compact">
                <div className="empty-state-icon" aria-hidden="true">📊</div>
                <p className="empty-state-title mb-0">No investments tracked yet</p>
                <p className="empty-state-subtitle">Add your first holding to start tracking performance.</p>
              </div>
            )}
          </div>

          <div className="row g-4">
            {/* Recent Transactions */}
            <div className="col-md-6">
              <div className="bg-glass-card h-100">
                <h6 className="text-white mb-3 fw-bold">Recent Transactions</h6>
                <div className="d-flex flex-column gap-2">
                  {transactions.length > 0 ? transactions.slice(0, 5).map((tx, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <span className="text-white d-block small fw-bold">{tx.symbol}</span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {formatDate(tx.executedAt)} •
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
                  <div className="empty-state-row empty-state-card--compact">
                    <div className="empty-state-icon" aria-hidden="true">📊</div>
                    <p className="empty-state-title mb-0">No investments tracked yet</p>
                    <p className="empty-state-subtitle">Add your first holding to start tracking performance.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Holdings List ────────────────────────────── */}
        <div className="d-flex flex-column gap-4">
          <div className="bg-glass-card h-100 overflow-hidden d-flex flex-column">
            <h6 className="text-white mb-3 fw-bold">Current Holdings</h6>
            <div className="d-flex px-2 py-1 mb-2" style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <div style={{ flex: '0 0 88px' }}>Symbol</div>
              <div style={{ flex: '0 0 66px' }}>Trend</div>
              <div style={{ flex: '0 0 70px', textAlign: 'right' }}>Qty</div>
              <div style={{ flex: '0 0 92px', textAlign: 'right' }}>Buy Price</div>
              <div style={{ flex: 1, textAlign: 'right' }}>Current Value</div>
              <div style={{ flex: '0 0 92px', textAlign: 'right' }}>P&L</div>
              <div style={{ flex: '0 0 58px', textAlign: 'right' }}>Action</div>
            </div>
            <div className="d-flex flex-column gap-1 overflow-auto">
              {holdings.length > 0 ? holdings.map((row, i) => (
                <div key={row._id || i} className="d-flex align-items-center p-3 rounded-3 hover-glow border-bottom border-secondary border-opacity-10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ flex: '0 0 88px' }}>
                    <span className="text-white fw-bold small d-block">{row.symbol}</span>
                    {row.name && row.name !== row.symbol && (
                      <span className="text-muted" style={{ fontSize: '0.6rem' }}>{row.name}</span>
                    )}
                  </div>
                  <div style={{ flex: '0 0 66px' }}>
                    <div
                      title={row.profitLoss > 0 ? 'In profit' : row.profitLoss < 0 ? 'At a loss' : 'Flat'}
                      className="d-inline-flex align-items-center justify-content-center rounded-pill"
                      style={{
                        width: '18px',
                        height: '18px',
                        background: row.profitLoss > 0 ? 'rgba(16,185,129,0.18)' : row.profitLoss < 0 ? 'rgba(239,68,68,0.18)' : 'rgba(148,163,184,0.18)',
                        border: row.profitLoss > 0 ? '1px solid rgba(16,185,129,0.3)' : row.profitLoss < 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(148,163,184,0.25)'
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: row.profitLoss > 0 ? '#10b981' : row.profitLoss < 0 ? '#ef4444' : '#94a3b8' }} />
                    </div>
                  </div>
                  <div style={{ flex: '0 0 70px', textAlign: 'right' }}>
                    <span className="text-white small fw-semibold">{row.quantity}</span>
                  </div>
                  <div style={{ flex: '0 0 92px', textAlign: 'right' }}>
                    <span className="text-muted small">{formatMoney(row.avgBuyPrice)}</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <span className="text-white small fw-semibold">{formatMoney(row.currentValue)}</span>
                  </div>
                  <div style={{ flex: '0 0 92px', textAlign: 'right' }}>
                    <span className={`small fw-bold ${row.profitLoss > 0 ? 'text-success' : row.profitLoss < 0 ? 'text-danger' : 'text-muted'}`}>
                      {formatSignedMoney(row.profitLoss)}
                    </span>
                  </div>
                  <div style={{ flex: '0 0 58px', textAlign: 'right' }}>
                    <button
                      className="btn btn-sm"
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        background: 'rgba(239,68,68,0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '6px',
                        lineHeight: 1.4
                      }}
                      onClick={() => setSellHolding(row)}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              )) : (
                <div className="empty-state-row empty-state-card--compact">
                  <div className="empty-state-icon" aria-hidden="true">📊</div>
                  <p className="empty-state-title mb-0">No holdings recorded</p>
                  <p className="empty-state-subtitle">Use '+ Add to Portfolio' to log your investments.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── P&L Breakdown Table ──────────────────────────────────────────── */}
      <PnLTable holdings={holdings} />

      {/* ─── Transaction History ──────────────────────────────────────────── */}
      <TransactionHistory transactions={transactions} loading={txLoading} />

      {/* ─── Add Holding Modal ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
          <div className="bg-glass-card p-4" style={{ width: '420px', maxWidth: '95vw', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-white fw-bold mb-0">Log a New Investment</h5>
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
                  <label className="text-muted small mb-1">Purchase Price *</label>
                  <input type="number" className="form-control bg-dark text-white border-secondary" placeholder="150.00" min="0" step="any"
                    value={addForm.avgBuyPrice} onChange={e => setAddForm(p => ({ ...p, avgBuyPrice: e.target.value }))} required />
                </div>
              </div>
              <p className="text-muted small mb-3" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                Enter the price and quantity as they were when you bought this stock in real life. TradeTrack uses this to calculate your current P&amp;L.
              </p>
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
                {addLoading ? 'Saving...' : 'Save Investment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Sell Modal ───────────────────────────────────────────────────── */}
      {sellHolding && (
        <SellModal
          holding={sellHolding}
          onClose={() => setSellHolding(null)}
          onSuccess={handleSellSuccess}
        />
      )}

    </div>
  );
}

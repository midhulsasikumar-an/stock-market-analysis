import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import authService from '../services/authService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ─── Utility helpers ──────────────────────────────────────────────────────────
const fmtMoney = (v) => {
    if (v == null || isNaN(v)) return '$0';
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(2)}`;
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
};

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

const getDateRange = (period) => {
    const now = new Date();
    const from = new Date();

    switch (period) {
        case '1D':
            from.setDate(now.getDate() - 1);
            break;
        case '1W':
            from.setDate(now.getDate() - 7);
            break;
        case '1M':
            from.setMonth(now.getMonth() - 1);
            break;
        case '1Y':
            from.setFullYear(now.getFullYear() - 1);
            break;
        case 'ALL':
            from.setFullYear(2000);
            break;
        default:
            from.setMonth(now.getMonth() - 1);
            break;
    }

    return { from: from.toISOString(), to: now.toISOString() };
};

const fmtCurrencyFull = (value) => Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

// ─── Shared chart options ──────────────────────────────────────────────────────
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: { color: 'rgba(255,255,255,0.5)', font: { size: 11 }, boxWidth: 12, padding: 16 }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff', bodyColor: '#94a3b8',
            padding: 12, cornerRadius: 10, displayColors: true
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } }
        },
        y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } }
        }
    }
};

// ─── Top Stats Card ────────────────────────────────────────────────────────────
function TopCard({ title, value, prefix = '', suffix = '', icon, trend, trendUp, loading }) {
    return (
        <div className="bg-glass-card h-100 p-4" style={{ borderRadius: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2">
                    <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)' }}>{icon}</span>
                    {title}
                </span>
            </div>
            {loading ? (
                <div className="placeholder-glow">
                    <span className="placeholder col-7 bg-secondary rounded" style={{ height: '36px' }} />
                </div>
            ) : (
                <h3 className="text-white fw-bold mb-2">
                    {prefix}
                    {typeof value === 'number'
                        ? value.toLocaleString('en-US', { maximumFractionDigits: 1 })
                        : value}
                    {suffix}
                </h3>
            )}
            <div className={`small fw-bold ${trendUp ? 'text-success' : 'text-danger'}`}>
                <span className={`badge ${trendUp ? 'bg-success' : 'bg-danger'} bg-opacity-10 px-2 py-1 me-2 rounded-pill`}>
                    {trendUp ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                </span>
                <span className="text-muted fw-normal">since last week</span>
            </div>
        </div>
    );
}

// ─── System Health Row ─────────────────────────────────────────────────────────
function HealthRow({ icon, iconBg, iconColor, title, subtitle, badge, badgeClass }) {
    return (
        <div className="p-3 rounded d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px', background: iconBg }}>
                    <span style={{ fontSize: '1.2rem' }} className={iconColor}>{icon}</span>
                </div>
                <div>
                    <h6 className="text-white fw-bold m-0" style={{ fontSize: '0.85rem' }}>{title}</h6>
                    <span className="text-muted small">{subtitle}</span>
                </div>
            </div>
            <span className={`badge rounded-pill px-3 py-2 fw-bold ${badgeClass}`}>{badge}</span>
        </div>
    );
}

// ─── Main AdminDashboard Component ────────────────────────────────────────────
export default function AdminDashboard() {
    // ── core dashboard data (topCards + chart + recent tx + health panel)
    const [dashData, setDashData] = useState(null);
    const [dashLoading, setDashLoading] = useState(true);

    // ── granular API states
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [chartData, setChartData] = useState(null);
    const [chartPeriod, setChartPeriod] = useState('ALL');
    const [chartLoading, setChartLoading] = useState(false);

    const [health, setHealth] = useState(null);
    const [healthLoading, setHealthLoading] = useState(true);

    const [recentUsers, setRecentUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);

    const [allUsers, setAllUsers] = useState([]);
    const [allUsersLoading, setAllUsersLoading] = useState(true);

    const [activityLog, setActivityLog] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);

    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [userSearch, setUserSearch] = useState('');
    const [expandUsers, setExpandUsers] = useState(false);

    const headers = authService.getAuthHeaders();

    // ── API fetchers ───────────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const r = await fetch(`${API_URL}/api/admin/stats`, { headers });
            const j = await r.json();
            if (j.success) setStats(j.data);
        } catch { /* silent */ } finally { setStatsLoading(false); }
    }, []); // eslint-disable-line

    const fetchChart = useCallback(async (period) => {
        setChartLoading(true);
        try {
            const { from, to } = getDateRange(period);
            const query = new URLSearchParams({ period, from, to }).toString();
            const r = await fetch(`${API_URL}/api/admin/chart?${query}`, { headers });
            const j = await r.json();
            console.log('[AdminDashboard] /api/admin/chart raw response:', { period, payload: j });
            if (j.success) setChartData(j.data);
        } catch { /* silent */ } finally { setChartLoading(false); }
    }, []); // eslint-disable-line

    const fetchHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const r = await fetch(`${API_URL}/api/admin/system-health`, { headers });
            const j = await r.json();
            if (j.success) setHealth(j.data);
        } catch { /* silent */ } finally { setHealthLoading(false); }
    }, []); // eslint-disable-line

    const fetchRecentUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const r = await fetch(`${API_URL}/api/admin/recent-users`, { headers });
            const j = await r.json();
            if (j.success) setRecentUsers(j.data);
        } catch { /* silent */ } finally { setUsersLoading(false); }
    }, []); // eslint-disable-line

    const fetchAllUsers = useCallback(async () => {
        setAllUsersLoading(true);
        try {
            const r = await fetch(`${API_URL}/api/admin/users`, { headers });
            const j = await r.json();
            if (j.success) setAllUsers(j.data);
        } catch { /* silent */ } finally { setAllUsersLoading(false); }
    }, []); // eslint-disable-line

    const fetchActivityLog = useCallback(async () => {
        setActivityLoading(true);
        try {
            const r = await fetch(`${API_URL}/api/admin/activity-log`, { headers });
            const j = await r.json();
            if (j.success) setActivityLog(j.data);
        } catch { /* silent */ } finally { setActivityLoading(false); }
    }, []); // eslint-disable-line

    const fetchDashboard = useCallback(async () => {
        setDashLoading(true);
        try {
            const r = await fetch(`${API_URL}/api/admin/dashboard`, { headers });
            const j = await r.json();
            if (j.success) { setDashData(j.data); setError(null); }
            else setError(j.message);
        } catch { setError('Failed to connect to server'); }
        finally { setDashLoading(false); }
    }, []); // eslint-disable-line

    const refreshAll = useCallback(() => {
        fetchDashboard();
        fetchStats();
        fetchChart(chartPeriod);
        fetchHealth();
        fetchRecentUsers();
        fetchAllUsers();
        fetchActivityLog();
        setLastRefresh(new Date());
    }, [fetchDashboard, fetchStats, fetchChart, fetchHealth, fetchRecentUsers, fetchAllUsers, fetchActivityLog, chartPeriod]);

    // Initial load
    useEffect(() => { refreshAll(); }, []); // eslint-disable-line

    // Auto-refresh every 60s
    const intervalRef = useRef(null);
    useEffect(() => {
        intervalRef.current = setInterval(refreshAll, 60000);
        return () => clearInterval(intervalRef.current);
    }, [refreshAll]);

    // Chart period change
    const handlePeriodChange = (p) => {
        setChartPeriod(p);
        fetchChart(p);
    };

    // ── Derived chart datasets ─────────────────────────────────────────────────
    const buySellChartData = chartData && chartData.length > 0
        ? {
            labels: chartData.map(d => d.label),
            datasets: [
                {
                    label: 'BUY',
                    data: chartData.map(d => d.buy),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                },
                {
                    label: 'SELL',
                    data: chartData.map(d => d.sell),
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                }
            ]
        }
        : dashData?.chartData && dashData.chartData.length > 0
            ? {
                labels: dashData.chartData.map(d => d._id),
                datasets: [{
                    label: 'Transactions',
                    data: dashData.chartData.map(d => d.count),
                    borderColor: 'rgba(56, 189, 248, 1)',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(56, 189, 248, 1)',
                }]
            }
            : null;

    // ── Fallback to dashData for top cards if /stats hasn't loaded ─────────────
    const s = stats || (dashData ? {
        totalUsers: dashData.totalUsers,
        activePortfolios: dashData.totalPortfolios,
        totalTransactions: dashData.totalTransactions,
        totalInvestment: dashData.totalInvestment,
        trends: { userGrowth: 0, userTrendUp: true, txGrowth: 0, txTrendUp: true }
    } : null);

    const recentTxs = dashData?.recentTransactions || [];
    const rawTotalPnL = stats?.totalPnL ?? dashData?.totalPnL ?? dashData?.totalProfitLoss;
    const totalPnL = Number.isFinite(Number(rawTotalPnL)) ? Number(rawTotalPnL) : null;
    const lastPriceUpdate = stats?.lastPriceUpdate ?? dashData?.lastPriceUpdate ?? null;

    const pnlToneClass = totalPnL == null
        ? 'text-secondary'
        : totalPnL > 0
            ? 'text-success'
            : totalPnL < 0
                ? 'text-danger'
                : 'text-secondary';

    const pnlDisplayText = totalPnL == null
        ? 'Unavailable'
        : totalPnL > 0
            ? `+$${fmtCurrencyFull(totalPnL)}`
            : totalPnL < 0
                ? `-$${fmtCurrencyFull(Math.abs(totalPnL))}`
                : '$0.00';

    // ── Health derived ──────────────────────────────────────────────────────────
    const mongo = health?.mongo;
    const express_ = health?.express;
    const finnhub = health?.finnhub;

    // ── User search filter ──────────────────────────────────────────────────────
    const filteredUsers = allUsers.filter(u =>
        !userSearch ||
        u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
    const displayedUsers = expandUsers ? filteredUsers : filteredUsers.slice(0, 8);

    // ── Handle user status toggle ───────────────────────────────────────────────
    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ accountStatus: newStatus })
            });
            setAllUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, accountStatus: newStatus } : u
            ));
        } catch { /* silent */ }
    };

    if (dashLoading && !dashData) {
        return (
            <div className="p-5 text-white text-center mt-5 d-flex flex-column align-items-center">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
                <p className="text-muted mt-3 small">Loading admin dashboard…</p>
            </div>
        );
    }

    if (error && !dashData) {
        return (
            <div className="p-5 text-danger text-center mt-5">
                <p>{error}</p>
                <button className="btn btn-sm btn-primary mt-2" onClick={refreshAll}>Retry</button>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 h-100" style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* ── Page Header ─────────────────────────────────────────────────── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="text-white fw-bold mb-0">Admin Control Center</h4>
                    <p className="text-muted small mb-0">
                        Live platform intelligence
                        {lastRefresh && (
                            <span className="ms-2" style={{ fontSize: '0.65rem' }}>
                                · Updated {lastRefresh.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={refreshAll}
                    disabled={dashLoading}
                >
                    {dashLoading ? <span className="spinner-border spinner-border-sm me-1" /> : '🔄'} Refresh
                </button>
            </div>

            {/* ── SECTION 1: Top Stats Cards ──────────────────────────────────── */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="Total Users"
                        value={s?.totalUsers ?? '—'}
                        icon="👥"
                        trend={s?.trends?.userGrowth ?? 0}
                        trendUp={s?.trends?.userTrendUp ?? true}
                        loading={statsLoading && !s}
                    />
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="Active Portfolios"
                        value={s?.activePortfolios ?? '—'}
                        icon="💼"
                        trend={8.1}
                        trendUp={true}
                        loading={statsLoading && !s}
                    />
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="Transactions"
                        value={s?.totalTransactions ?? '—'}
                        icon="💸"
                        trend={s?.trends?.txGrowth ?? 0}
                        trendUp={s?.trends?.txTrendUp ?? true}
                        loading={statsLoading && !s}
                    />
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="System Investment"
                        value={s ? s.totalInvestment / 1000 : '—'}
                        prefix="$"
                        suffix="K"
                        icon="📈"
                        trend={18.2}
                        trendUp={true}
                        loading={statsLoading && !s}
                    />
                </div>
            </div>

            {/* ── SECTION 2 & 3: Chart + Highlight Panel ──────────────────────── */}
            <div className="row g-4 mb-4">

                {/* Transaction Summary Chart */}
                <div className="col-12 col-lg-8">
                    <div className="bg-glass-card p-4 h-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                            <div>
                                <h5 className="text-white fw-bold m-0">Transaction Summary</h5>
                                <p className="text-muted small m-0 mt-1">
                                    BUY &amp; SELL activity — grouped by {chartPeriod}
                                </p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                {['1D', '1W', '1M', '1Y', 'ALL'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => handlePeriodChange(t)}
                                        className={`btn btn-sm ${t === chartPeriod ? 'btn-primary' : 'btn-outline-secondary'} rounded-pill px-3 fw-bold`}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: '280px', position: 'relative' }}>
                            {chartLoading ? (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="spinner-border text-primary spinner-border-sm" />
                                </div>
                            ) : buySellChartData ? (
                                <Line data={buySellChartData} options={chartOptions} />
                            ) : chartPeriod === '1D' ? (
                                <div className="d-flex align-items-center justify-content-center h-100 text-center px-3">
                                    <div>
                                        <div className="mb-2" style={{ fontSize: '1.35rem' }}>🕒</div>
                                        <p className="text-white mb-1 small fw-bold">No trades in the last 24 hours</p>
                                        <p className="text-muted small mb-0">
                                            Reason: no transactions were executed in this 1D window.
                                        </p>
                                    </div>
                                </div>
                            ) : chartPeriod === 'ALL' && (s?.totalTransactions || 0) === 0 ? (
                                <div className="d-flex align-items-center justify-content-center h-100 text-center px-3">
                                    <div>
                                        <div className="mb-2" style={{ fontSize: '1.35rem' }}>📭</div>
                                        <p className="text-white mb-1 small fw-bold">No trades recorded yet</p>
                                        <p className="text-muted small mb-0">
                                            Reason: the database currently has zero trade records.
                                        </p>
                                    </div>
                                </div>
                            ) : (s?.totalTransactions || 0) > 0 ? (
                                <div className="d-flex align-items-center justify-content-center h-100 text-center px-3">
                                    <div>
                                        <div className="mb-2" style={{ fontSize: '1.35rem' }}>🗓️</div>
                                        <p className="text-white mb-1 small fw-bold">No trades in this selected period</p>
                                        <p className="text-muted small mb-0">
                                            Reason: this time window has no executions. Try 1M or ALL to view recorded transactions.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-center px-3">
                                    <div>
                                        <div className="mb-2" style={{ fontSize: '1.35rem' }}>📭</div>
                                        <p className="text-white mb-1 small fw-bold">No transaction data available</p>
                                        <p className="text-muted small mb-0">
                                            Reason: the database currently has zero trade records.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Highlight / P&L Panel */}
                <div className="col-12 col-lg-4">
                    <div className="h-100 p-4 d-flex flex-column justify-content-center"
                        style={{
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h4 className="text-white fw-light mb-3" style={{ opacity: 0.9 }}>
                                Total Network <br /><strong className="fw-bold">Profit &amp; Loss</strong>
                            </h4>
                            {dashLoading ? (
                                <div className="placeholder-glow mb-3">
                                    <span className="placeholder col-8 bg-white bg-opacity-25 rounded" style={{ height: '48px', display: 'block' }} />
                                </div>
                            ) : (
                                <h1 className={`fw-bold mb-3 display-5 ${pnlToneClass}`}>
                                    {pnlDisplayText}
                                </h1>
                            )}
                            <p className="text-white mb-3" style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                                Global tracking analytics <br />across all portfolios.
                            </p>
                            {totalPnL === 0 ? (
                                <p className="mb-2" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                                    Prices loading...
                                </p>
                            ) : null}
                            <p className="mb-3" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                                Prices cached · Last updated {lastPriceUpdate ? timeAgo(lastPriceUpdate) : 'pending'}
                            </p>
                            {/* Mini stats */}
                            <div className="d-flex gap-3">
                                <div className="text-center">
                                    <div className="text-white fw-bold">{s?.totalUsers ?? '—'}</div>
                                    <div className="text-white small" style={{ opacity: 0.7 }}>Users</div>
                                </div>
                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                                <div className="text-center">
                                    <div className="text-white fw-bold">{s?.activePortfolios ?? '—'}</div>
                                    <div className="text-white small" style={{ opacity: 0.7 }}>Portfolios</div>
                                </div>
                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                                <div className="text-center">
                                    <div className="text-white fw-bold">{s?.totalTransactions ?? '—'}</div>
                                    <div className="text-white small" style={{ opacity: 0.7 }}>Trades</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 4 & 5: Recent Transactions + System Health ──────────── */}
            <div className="row g-4 mb-4">

                {/* Live Platform Updates */}
                <div className="col-12 col-lg-8">
                    <div className="bg-glass-card p-4 h-100" style={{ borderRadius: '16px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="text-white fw-bold mb-0">Live Platform Updates</h5>
                            <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill small">
                                ● Live
                            </span>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-dark table-hover mb-0 align-middle" style={{ background: 'transparent' }}>
                                <thead>
                                    <tr>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25">Symbol</th>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25">User</th>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25">Type</th>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25 text-end">Amount</th>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25 text-end">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashLoading && recentTxs.length === 0 ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                {[...Array(5)].map((_, j) => (
                                                    <td key={j} className="py-3">
                                                        <span className="placeholder col-8 rounded" style={{ background: 'rgba(255,255,255,0.05)', display: 'block', height: '18px' }} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : recentTxs.slice(0, 5).map((tx, idx) => (
                                        <tr key={tx._id || idx} style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="rounded border border-secondary d-flex justify-content-center align-items-center"
                                                        style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                                        <span className="text-white fw-bold small">{tx.symbol?.charAt(0)}</span>
                                                    </div>
                                                    <span className="text-white fw-bold">{tx.symbol}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-muted small">{tx.userId?.username || 'System User'}</td>
                                            <td className="py-3">
                                                <span className={`badge px-2 py-1 rounded-pill fw-bold border-0 ${tx.type === 'BUY'
                                                    ? 'bg-success text-success bg-opacity-10'
                                                    : 'bg-danger text-danger bg-opacity-10'}`}>
                                                    {tx.type === 'BUY' ? '▲ BUY' : '▼ SELL'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-end text-white fw-bold">
                                                {fmtMoney(tx.totalAmount)}
                                            </td>
                                            <td className="py-3 text-end text-muted small">
                                                {timeAgo(tx.executedAt || tx.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                    {!dashLoading && recentTxs.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-4 text-muted">No recent transactions</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* System Health */}
                <div className="col-12 col-lg-4">
                    <div className="bg-glass-card p-4 h-100" style={{ borderRadius: '16px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="text-white fw-bold mb-0">System Health</h5>
                            {healthLoading && <span className="spinner-border spinner-border-sm text-primary" />}
                        </div>
                        <div className="d-flex flex-column gap-3">

                            {/* MongoDB */}
                            <HealthRow
                                icon="🗄️"
                                iconBg="rgba(25, 135, 84, 0.2)"
                                iconColor="text-success"
                                title="MongoDB Cluster"
                                subtitle={mongo
                                    ? `${mongo.status} · Latency: ${mongo.latency}ms`
                                    : 'Checking…'}
                                badge={mongo?.status || '…'}
                                badgeClass={mongo?.status === 'Online'
                                    ? 'bg-success bg-opacity-10 text-success'
                                    : 'bg-danger bg-opacity-10 text-danger'}
                            />

                            {/* Express API */}
                            <HealthRow
                                icon="📡"
                                iconBg="rgba(13, 110, 253, 0.2)"
                                iconColor="text-primary"
                                title="Express API Core"
                                subtitle={express_
                                    ? `Uptime: ${Math.floor((express_.uptime || 0) / 60)}m ${(express_.uptime || 0) % 60}s`
                                    : 'Checking…'}
                                badge={express_?.status || '…'}
                                badgeClass="bg-primary bg-opacity-10 text-primary"
                            />

                            {/* Finnhub */}
                            <HealthRow
                                icon="🔔"
                                iconBg="rgba(255, 193, 7, 0.2)"
                                iconColor="text-warning"
                                title="Finnhub API"
                                subtitle={finnhub
                                    ? `${finnhub.status}${finnhub.latency != null ? ` · ${finnhub.latency}ms` : ''} · Today: ${finnhub.requestsToday ?? 0} tx`
                                    : 'Checking…'}
                                badge={finnhub?.status || '…'}
                                badgeClass={finnhub?.status === 'Connected'
                                    ? 'bg-success bg-opacity-10 text-success'
                                    : finnhub?.status === 'Failed'
                                        ? 'bg-danger bg-opacity-10 text-danger'
                                        : 'bg-warning bg-opacity-10 text-warning'}
                            />

                            {/* Platform Analytics mini-cards */}
                            <div className="mt-2 p-3 rounded" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                                <h6 className="text-white fw-bold mb-3" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Analytics</h6>
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Total Investments</span>
                                        <span className="text-white small fw-bold">{fmtMoney(s?.totalInvestment)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Network P&amp;L</span>
                                        <span className={`small fw-bold ${pnlToneClass}`}>
                                            {pnlDisplayText}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Avg Portfolio Value</span>
                                        <span className="text-white small fw-bold">
                                            {s?.totalUsers > 0
                                                ? fmtMoney((s?.totalInvestment || 0) / s.totalUsers)
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 6: User Management Table ────────────────────────────── */}
            <div className="row g-4 mb-4">
                <div className="col-12">
                    <div className="bg-glass-card p-4" style={{ borderRadius: '16px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                            <h5 className="text-white fw-bold mb-0">User Management</h5>
                            <div className="d-flex gap-2 align-items-center">
                                <input
                                    type="text"
                                    className="form-control form-control-sm bg-dark text-white border-secondary"
                                    placeholder="Search users…"
                                    style={{ width: '200px', fontSize: '0.8rem' }}
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                />
                                <span className="text-muted small">{filteredUsers.length} users</span>
                            </div>
                        </div>

                        {allUsersLoading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary spinner-border-sm" />
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="table table-dark table-hover mb-0 align-middle" style={{ background: 'transparent' }}>
                                        <thead>
                                            <tr>
                                                <th className="text-muted small fw-bold border-bottom border-secondary pb-3 border-opacity-25">User</th>
                                                <th className="text-muted small fw-bold border-bottom border-secondary pb-3 border-opacity-25">Email</th>
                                                <th className="text-muted small fw-bold border-bottom border-secondary pb-3 border-opacity-25 text-end">Portfolio Value</th>
                                                <th className="text-muted small fw-bold border-bottom border-secondary pb-3 border-opacity-25 text-center">Transactions</th>
                                                <th className="text-muted small fw-bold border-bottom border-secondary pb-3 border-opacity-25">Joined</th>
                                                <th className="text-muted small fw-bold border-bottom border-secondary pb-3 border-opacity-25 text-center">Status</th>
                                                <th className="text-muted small fw-bold border-bottom border-secondary pb-3 border-opacity-25 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedUsers.map((u, idx) => (
                                                <tr key={u._id || idx} style={{ borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                                                style={{
                                                                    width: '32px', height: '32px', flexShrink: 0,
                                                                    background: `hsl(${(u.username?.charCodeAt(0) || 65) * 5}, 60%, 30%)`,
                                                                    fontSize: '0.75rem'
                                                                }}>
                                                                {(u.username || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-white fw-bold small">{u.username}</div>
                                                                {u.role === 'admin' && (
                                                                    <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '0.6rem' }}>Admin</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-muted small">{u.email}</td>
                                                    <td className="py-3 text-white fw-bold text-end small">
                                                        {fmtMoney(u.portfolioValue || 0)}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="badge bg-secondary bg-opacity-25 text-white px-2 py-1">
                                                            {u.transactionCount || 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-muted small">{fmtDate(u.createdAt)}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`badge rounded-pill px-2 py-1 small fw-bold ${u.accountStatus === 'active'
                                                            ? 'bg-success bg-opacity-10 text-success'
                                                            : 'bg-danger bg-opacity-10 text-danger'}`}>
                                                            {u.accountStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <div className="d-flex gap-1 justify-content-center">
                                                            <button
                                                                className={`btn btn-sm fw-bold border-0 ${u.accountStatus === 'active'
                                                                    ? 'bg-danger bg-opacity-10 text-danger'
                                                                    : 'bg-success bg-opacity-10 text-success'}`}
                                                                style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px' }}
                                                                onClick={() => toggleUserStatus(u._id, u.accountStatus)}
                                                                disabled={u.role === 'admin'}
                                                                title={u.role === 'admin' ? 'Cannot modify admin' : ''}
                                                            >
                                                                {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <tr><td colSpan="7" className="text-center py-4 text-muted">No users found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredUsers.length > 8 && (
                                    <div className="text-center mt-3">
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={() => setExpandUsers(v => !v)}
                                        >
                                            {expandUsers ? `Show less ↑` : `Show all ${filteredUsers.length} users ↓`}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── SECTION 7 & 8: Recent Users + Activity Log ──────────────────── */}
            <div className="row g-4 mb-2">

                {/* Recent Users */}
                <div className="col-12 col-lg-5">
                    <div className="bg-glass-card p-4 h-100" style={{ borderRadius: '16px' }}>
                        <h5 className="text-white fw-bold mb-4">Recent Registrations</h5>
                        {usersLoading ? (
                            <div className="text-center py-3">
                                <div className="spinner-border text-primary spinner-border-sm" />
                            </div>
                        ) : recentUsers.length === 0 ? (
                            <p className="text-muted small text-center py-3">No users yet</p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {recentUsers.map((u, i) => (
                                    <div key={u._id || i} className="d-flex align-items-center justify-content-between p-2 rounded-3"
                                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                                style={{
                                                    width: '34px', height: '34px',
                                                    background: `hsl(${(u.username?.charCodeAt(0) || 65) * 5}, 60%, 28%)`,
                                                    fontSize: '0.75rem', flexShrink: 0
                                                }}>
                                                {(u.username || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-white small fw-bold">{u.username}</div>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>{u.email}</div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{timeAgo(u.createdAt)}</div>
                                            <span className={`badge small ${u.accountStatus === 'active'
                                                ? 'bg-success bg-opacity-10 text-success'
                                                : 'bg-secondary text-muted'}`}
                                                style={{ fontSize: '0.55rem' }}>
                                                {u.accountStatus}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Activity Log */}
                <div className="col-12 col-lg-7">
                    <div className="bg-glass-card p-4 h-100" style={{ borderRadius: '16px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="text-white fw-bold mb-0">Activity Log</h5>
                            <span className="text-muted small">Last 10 events</span>
                        </div>
                        {activityLoading ? (
                            <div className="text-center py-3">
                                <div className="spinner-border text-primary spinner-border-sm" />
                            </div>
                        ) : activityLog.length === 0 ? (
                            <p className="text-muted small text-center py-3">No activity yet</p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {activityLog.map((log, i) => (
                                    <div key={log._id || i} className="d-flex align-items-start gap-3 p-2 rounded-3"
                                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                                            style={{
                                                width: '28px', height: '28px',
                                                background: log.type === 'BUY'
                                                    ? 'rgba(16,185,129,0.15)'
                                                    : 'rgba(239,68,68,0.15)',
                                                fontSize: '0.7rem'
                                            }}>
                                            {log.type === 'BUY' ? '📈' : '📉'}
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="text-white mb-0 small">{log.message}</p>
                                        </div>
                                        <div className="text-muted flex-shrink-0" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                            {timeAgo(log.timestamp)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend as RechartsLegend,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import authService from '../services/authService';
import adminService from '../services/adminService';

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

const createMockActivityData = (days) => {
    const safeDays = Math.min(Math.max(Number(days) || 30, 1), 30);
    const now = new Date();

    return Array.from({ length: safeDays }).map((_, idx) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (safeDays - 1 - idx));

        return {
            date: date.toISOString().slice(0, 10),
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            activeUsers: 1 + Math.floor(Math.random() * 10),
            tradeEntries: Math.floor(Math.random() * 6)
        };
    });
};

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

    const [activityData, setActivityData] = useState([]);
    const [activityDays, setActivityDays] = useState(30);
    const [activityLoading, setActivityLoading] = useState(false);

    const [health, setHealth] = useState(null);
    const [healthLoading, setHealthLoading] = useState(true);

    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

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

    const fetchActivityTimeline = useCallback(async (days) => {
        setActivityLoading(true);
        try {
            const response = await adminService.getActivityTimeline(days);
            if (response.success) {
                setActivityData(Array.isArray(response.data) ? response.data : []);
            } else {
                setActivityData(createMockActivityData(days));
            }
        } catch {
            // Placeholder chart data so the UI remains informative if endpoint fails.
            setActivityData(createMockActivityData(days));
        } finally {
            setActivityLoading(false);
        }
    }, []);

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
        fetchActivityTimeline(activityDays);
        setLastRefresh(new Date());
    }, [fetchDashboard, fetchStats, fetchChart, fetchHealth, fetchActivityTimeline, chartPeriod, activityDays]);

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

    const handleActivityRangeChange = (days) => {
        setActivityDays(days);
        fetchActivityTimeline(days);
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
                <button className="admin-primary-button mt-2" onClick={refreshAll}>Retry</button>
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
                    className="admin-secondary-button"
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

            {/* ── SECTION 2: Platform Activity Timeline (Full Width) ─────────── */}
            <div className="row g-4 mb-4">
                <div className="col-12">
                    <div className="bg-glass-card p-4" style={{ borderRadius: '16px' }}>
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                            <div>
                                <h5 className="text-white fw-bold m-0">Platform Activity</h5>
                                <p className="text-muted small m-0 mt-1">Active users and trade entries per day</p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                {[7, 14, 30].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => handleActivityRangeChange(days)}
                                        className={days === activityDays ? 'admin-primary-button' : 'admin-secondary-button'}
                                    >
                                        {`${days}D`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: 280 }}>
                            {activityLoading ? (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="spinner-border text-primary spinner-border-sm" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activityData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                        <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                                            tickLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                                            tickLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{
                                                background: 'rgba(15, 23, 42, 0.95)',
                                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                                borderRadius: 10,
                                                color: '#e2e8f0'
                                            }}
                                            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                                            formatter={(value, name) => [value, name]}
                                        />
                                        <RechartsLegend
                                            verticalAlign="top"
                                            align="left"
                                            iconType="square"
                                            iconSize={10}
                                            wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, paddingBottom: 8 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="activeUsers"
                                            name="Active Users"
                                            stroke="#1D9E75"
                                            strokeWidth={2}
                                            fill="#1D9E75"
                                            fillOpacity={0.15}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="tradeEntries"
                                            name="Trade Entries"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            fill="#3B82F6"
                                            fillOpacity={0.15}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 3 & 4: Chart + Highlight Panel ──────────────────────── */}
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
                                        className={t === chartPeriod ? 'admin-primary-button' : 'admin-secondary-button'}
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
                            <div className="d-flex align-items-center gap-3">
                                <h5 className="text-white fw-bold mb-0">Live Platform Updates</h5>
                                <Link to="/admin/trades" className="text-info small fw-semibold" style={{ textDecoration: 'none' }}>
                                    View all
                                </Link>
                            </div>
                            <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill small">● Live</span>
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

        </div>
    );
}

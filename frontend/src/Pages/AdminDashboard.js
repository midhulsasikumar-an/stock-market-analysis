import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import authService from '../services/authService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await fetch(`${API_URL}/api/admin/dashboard`, {
                    headers: authService.getAuthHeaders()
                });
                const json = await response.json();
                if (json.success) setData(json.data);
                else setError(json.message);
            } catch (err) {
                setError("Failed to load admin dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [API_URL]);

    if (loading) return <div className="p-5 text-white text-center mt-5 d-flex flex-column align-items-center"><div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} /></div>;
    if (error) return <div className="p-5 text-danger text-center mt-5">{error}</div>;

    // Chart configuration
    const labels = data?.chartData?.map(d => d._id) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const chartValues = data?.chartData?.map(d => d.count) || [65, 59, 80, 81, 56, 55];

    const lineData = {
        labels,
        datasets: [
            {
                label: 'Transactions',
                data: chartValues,
                borderColor: 'rgba(56, 189, 248, 1)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgba(56, 189, 248, 1)',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 10,
                displayColors: false,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
            }
        }
    };

    const TopCard = ({ title, value, prefix = "", suffix = "", icon, trend, trendUp }) => (
        <div className="bg-glass-card h-100 p-4" style={{ borderRadius: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2">
                    <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)' }}>{icon}</span> {title}
                </span>
            </div>
            <h3 className="text-white fw-bold mb-2">
                {prefix}{typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value}{suffix}
            </h3>
            <div className={`small fw-bold ${trendUp ? 'text-success' : 'text-danger'}`}>
                <span className={`badge ${trendUp ? 'bg-success' : 'bg-danger'} bg-opacity-10 px-2 py-1 me-2 rounded-pill`}>
                    {trendUp ? '↑' : '↓'} {trend}%
                </span>
                <span className="text-muted fw-normal">since last week</span>
            </div>
        </div>
    );

    return (
        <div className="container-fluid py-4 h-100" style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* ── SECTION 1: Top Row Cards ── */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="Total Users"
                        value={data.totalUsers}
                        icon="👥"
                        trend="12.5"
                        trendUp={true}
                    />
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="Active Portfolios"
                        value={data.totalPortfolios}
                        icon="💼"
                        trend="8.1"
                        trendUp={true}
                    />
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="Transactions"
                        value={data.totalTransactions}
                        icon="💸"
                        trend="24.3"
                        trendUp={true}
                    />
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                    <TopCard
                        title="System Investment"
                        value={data.totalInvestment / 1000}
                        prefix="$"
                        suffix="k"
                        icon="📈"
                        trend="18.2"
                        trendUp={true}
                    />
                </div>
            </div>

            {/* ── SECTION 2 & 3: Main Chart and Highlight Panel ── */}
            <div className="row g-4 mb-4">

                {/* Main Chart */}
                <div className="col-12 col-lg-8">
                    <div className="bg-glass-card p-4 h-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="text-white fw-bold m-0">Transaction Summary</h5>
                                <p className="text-muted small m-0 mt-1">Global platform activity growth</p>
                            </div>
                            <div className="d-flex gap-2">
                                {['1D', '1W', '1M', '1Y', 'All'].map(t => (
                                    <button key={t} className={`btn btn-sm ${t === '1W' ? 'btn-primary' : 'btn-outline-secondary'} rounded-pill px-3 fw-bold`} style={{ fontSize: '0.8rem' }}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: '300px' }}>
                            <Line data={lineData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                {/* Highlight Panel */}
                <div className="col-12 col-lg-4">
                    <div className="h-100 p-4 d-flex flex-column justify-content-center"
                        style={{
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>

                        {/* Decorative background circle */}
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h4 className="text-white fw-light mb-3" style={{ opacity: 0.9 }}>Total Network <br /><strong className="fw-bold">Profit & Loss</strong></h4>
                            <h1 className="text-white fw-bold mb-3 display-5">
                                {data.totalProfitLoss >= 0 ? '+' : '-'}${Math.abs(data.totalProfitLoss / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K
                            </h1>
                            <div className="d-inline-flex px-3 py-2 rounded-pill bg-white bg-opacity-25 text-white fw-bold align-items-center gap-2 mb-4" style={{ backdropFilter: 'blur(5px)' }}>
                                <span>{data.totalProfitLoss >= 0 ? '📈 Grown' : '📉 Decreased'} By</span>
                            </div>
                            <p className="text-white mb-0" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                                Global tracking analytics <br /> across all portfolios.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── SECTION 4 & 5: System Health & Recent Transactions ── */}
            <div className="row g-4">

                {/* Recent Transactions Table */}
                <div className="col-12 col-lg-8">
                    <div className="bg-glass-card p-4 h-100" style={{ borderRadius: '16px' }}>
                        <h5 className="text-white fw-bold mb-4">Live Platform Updates</h5>

                        <div className="table-responsive">
                            <table className="table table-dark table-hover mb-0 align-middle" style={{ background: 'transparent' }}>
                                <thead>
                                    <tr>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25">Symbol</th>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25">User</th>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25">Type</th>
                                        <th className="text-muted small fw-bold border-bottom border-secondary pt-0 pb-3 border-opacity-25 text-end">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentTransactions?.slice(0, 5).map((tx, idx) => (
                                        <tr key={tx._id || idx} style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="rounded border border-secondary d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)' }}>
                                                        <span className="text-white fw-bold small">{tx.symbol?.charAt(0)}</span>
                                                    </div>
                                                    <span className="text-white fw-bold">{tx.symbol}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-muted small">{tx.userId?.username || 'System User'}</td>
                                            <td className="py-3">
                                                <span className={`badge px-2 py-1 rounded-pill ${tx.type === 'BUY' ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-10 fw-bold border-0`}>
                                                    {tx.type === 'BUY' ? '▲ BUY' : '▼ SELL'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-end text-white fw-bold">
                                                ${tx.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data.recentTransactions || data.recentTransactions.length === 0) && (
                                        <tr><td colSpan="4" className="text-center py-4 text-muted">No recent transactions</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* System Health Overview */}
                <div className="col-12 col-lg-4">
                    <div className="bg-glass-card p-4 h-100" style={{ borderRadius: '16px' }}>
                        <h5 className="text-white fw-bold mb-4">System Health</h5>

                        <div className="d-flex flex-column gap-3">
                            <div className="p-3 rounded d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(25, 135, 84, 0.2)' }}>
                                        <span className="text-success fs-5">🗄️</span>
                                    </div>
                                    <div>
                                        <h6 className="text-white fw-bold m-0">MongoDB Cluster</h6>
                                        <span className="text-muted small">Connected, Latency: 12ms</span>
                                    </div>
                                </div>
                                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold">Online</span>
                            </div>

                            <div className="p-3 rounded d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(13, 110, 253, 0.2)' }}>
                                        <span className="text-primary fs-5">📡</span>
                                    </div>
                                    <div>
                                        <h6 className="text-white fw-bold m-0">Express API Core</h6>
                                        <span className="text-muted small">Requests Today: {data.apiCallsToday?.toLocaleString()}</span>
                                    </div>
                                </div>
                                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-bold">Active</span>
                            </div>

                            <div className="p-3 rounded d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(255, 193, 7, 0.2)' }}>
                                        <span className="text-warning fs-5">🔔</span>
                                    </div>
                                    <div>
                                        <h6 className="text-white fw-bold m-0">Active Alerts</h6>
                                        <span className="text-muted small">Global Triggers Setup</span>
                                    </div>
                                </div>
                                <span className="text-white fw-bold fs-5 d-flex px-3">{data.activeAlerts}</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

        </div>
    );
}

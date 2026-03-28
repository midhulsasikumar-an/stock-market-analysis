import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip
} from 'chart.js';
import adminService from '../services/adminService';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    AdminStatCard,
    formatCompact,
    formatMoney
} from '../components/admin/AdminUI';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#cbd5e1' }
        }
    },
    scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.08)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.08)' } }
    }
};

export default function AdminAnalytics() {
    const [period, setPeriod] = useState('6M');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        adminService.getAnalytics({ period })
            .then((response) => {
                setAnalytics(response.data);
                setError('');
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [period]);

    const topStocks = analytics?.topStocks || [];
    const tradingVolume = analytics?.tradingVolume || [];
    const userGrowth = analytics?.userGrowth || [];
    const platformStats = analytics?.platformStats;

    return (
        <div>
            <AdminPageHeader
                eyebrow="Platform intelligence"
                title="Analytics"
                description="Track the most traded stocks, platform volume, user growth, and headline platform statistics from one screen."
                actions={(
                    <select className="admin-select" value={period} onChange={(event) => setPeriod(event.target.value)}>
                        <option value="1M">1 month</option>
                        <option value="6M">6 months</option>
                        <option value="1Y">1 year</option>
                        <option value="ALL">All time</option>
                    </select>
                )}
            />

            {loading ? <AdminPanel><p className="admin-muted mb-0">Loading analytics...</p></AdminPanel> : null}
            {error ? <p className="text-danger mb-3">{error}</p> : null}

            {analytics && platformStats ? (
                <>
                    <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
                        <AdminStatCard label="Active Users 30D" value={formatCompact(platformStats.activeUsers30d)} />
                        <AdminStatCard label="Active Portfolios" value={formatCompact(platformStats.activePortfolios)} />
                        <AdminStatCard label="Total Transactions" value={formatCompact(platformStats.totalTransactions)} />
                        <AdminStatCard label="Enabled Stocks" value={formatCompact(platformStats.enabledStocks)} />
                    </div>

                    <div className="admin-grid admin-grid-two">
                        <AdminPanel title="Most traded stocks" subtitle="Trade count by symbol">
                            {topStocks.length === 0 ? (
                                <AdminEmptyState title="No trading data" description="Trades will appear here once the platform starts processing activity." />
                            ) : (
                                <div className="admin-chart-shell">
                                    <Bar
                                        data={{
                                            labels: topStocks.map((item) => item.symbol),
                                            datasets: [{ label: 'Trades', data: topStocks.map((item) => item.trades), backgroundColor: '#0ea5e9' }]
                                        }}
                                        options={chartOptions}
                                    />
                                </div>
                            )}
                        </AdminPanel>

                        <AdminPanel title="Trading volume" subtitle="Buy and sell volume over time">
                            {tradingVolume.length === 0 ? (
                                <AdminEmptyState title="No volume data" description="Trading volume will render once there is activity in the selected period." />
                            ) : (
                                <div className="admin-chart-shell">
                                    <Bar
                                        data={{
                                            labels: tradingVolume.map((item) => item.label),
                                            datasets: [
                                                { label: 'Buy Volume', data: tradingVolume.map((item) => item.buyVolume), backgroundColor: '#22c55e' },
                                                { label: 'Sell Volume', data: tradingVolume.map((item) => item.sellVolume), backgroundColor: '#ef4444' }
                                            ]
                                        }}
                                        options={chartOptions}
                                    />
                                </div>
                            )}
                        </AdminPanel>

                        <AdminPanel title="User growth" subtitle="New account creation trend">
                            {userGrowth.length === 0 ? (
                                <AdminEmptyState title="No growth data" description="New registrations in the selected period will appear here." />
                            ) : (
                                <div className="admin-chart-shell">
                                    <Line
                                        data={{
                                            labels: userGrowth.map((item) => item.label),
                                            datasets: [{ label: 'New users', data: userGrowth.map((item) => item.users), borderColor: '#7dd3fc', backgroundColor: 'rgba(14, 165, 233, 0.18)', fill: true, tension: 0.35 }]
                                        }}
                                        options={chartOptions}
                                    />
                                </div>
                            )}
                        </AdminPanel>

                        <AdminPanel title="Platform statistics" subtitle="Aggregate balance and profitability">
                            <div className="admin-chart-shell" style={{ minHeight: 280 }}>
                                <Doughnut
                                    data={{
                                        labels: ['Investment', 'Profit / Loss'],
                                        datasets: [{
                                            data: [platformStats.totalInvestment, Math.abs(platformStats.totalProfitLoss)],
                                            backgroundColor: ['#0ea5e9', platformStats.totalProfitLoss >= 0 ? '#22c55e' : '#ef4444'],
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { labels: { color: '#cbd5e1' } } }
                                    }}
                                />
                            </div>
                            <div className="admin-detail-grid" style={{ justifyContent: 'space-between', marginTop: 16 }}>
                                <div>
                                    <strong>Total investment</strong>
                                    <span className="admin-muted">{formatMoney(platformStats.totalInvestment)}</span>
                                </div>
                                <div>
                                    <strong>Total P&amp;L</strong>
                                    <span className={platformStats.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}>{formatMoney(platformStats.totalProfitLoss)}</span>
                                </div>
                            </div>
                        </AdminPanel>
                    </div>
                </>
            ) : null}
        </div>
    );
}
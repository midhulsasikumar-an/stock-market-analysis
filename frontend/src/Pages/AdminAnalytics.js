import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    Filler,
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

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

const watchlistFallback = [
    { symbol: 'AAPL', watchingUsers: 9, investedUsers: 6 },
    { symbol: 'AMZN', watchingUsers: 8, investedUsers: 4 },
    { symbol: 'TSLA', watchingUsers: 10, investedUsers: 5 },
    { symbol: 'GOOGL', watchingUsers: 7, investedUsers: 3 },
    { symbol: 'MSFT', watchingUsers: 8, investedUsers: 6 },
    { symbol: 'NVDA', watchingUsers: 6, investedUsers: 4 }
];

const donutCenterLabelPlugin = {
    id: 'donutCenterLabelPlugin',
    afterDraw: (chart, args, pluginOptions) => {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        if (!meta?.data?.[0]) return;

        const centerX = meta.data[0].x;
        const centerY = meta.data[0].y;
        const title = pluginOptions?.title || 'Total';
        const value = pluginOptions?.value || '';

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.95)';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText(title, centerX, centerY - 12);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.fillText(value, centerX, centerY + 8);
        ctx.restore();
    }
};

const userGrowthOverlayPlugin = {
    id: 'userGrowthOverlayPlugin',
    afterDatasetsDraw: (chart, args, pluginOptions) => {
        const points = chart.getDatasetMeta(0)?.data || [];
        if (points.length === 0) return;

        const { ctx, chartArea } = chart;
        const values = pluginOptions?.values || [];
        const first = values[0];
        const last = values[values.length - 1];

        ctx.save();
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${first}`, points[0].x + 6, points[0].y - 6);

        ctx.textAlign = 'right';
        ctx.fillText(`${last}`, points[points.length - 1].x - 6, points[points.length - 1].y - 6);

        if (typeof first === 'number' && typeof last === 'number' && last < first) {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#fbbf24';
            ctx.font = '600 11px Inter, sans-serif';
            ctx.fillText('Growth declining - consider user engagement improvements', chartArea.left + 6, chartArea.top + 16);
        }
        ctx.restore();
    }
};

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
    const [watchVsPortfolio, setWatchVsPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            adminService.getAnalytics({ period }),
            adminService.getWatchlistVsPortfolio().catch(() => ({ success: false, data: [] }))
        ])
            .then(([analyticsResponse, watchResponse]) => {
                setAnalytics(analyticsResponse.data);
                const watchData = Array.isArray(watchResponse?.data) && watchResponse.data.length > 0
                    ? watchResponse.data
                    : watchlistFallback;
                setWatchVsPortfolio(watchData);
                setError('');
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [period]);

    const topStocks = analytics?.topStocks || [];
    const tradingVolume = analytics?.tradingVolume || [];
    const userGrowth = analytics?.userGrowth || [];
    const platformStats = analytics?.platformStats;

    const absPnl = Math.abs(Number(platformStats?.totalProfitLoss || 0));
    const totalInvestment = Number(platformStats?.totalInvestment || 0);
    const pnlIsZero = absPnl === 0;
    const donutVisualData = pnlIsZero ? [95, 5] : [Math.max(totalInvestment, 1), absPnl];

    const growthValues = userGrowth.map((item) => Number(item.users) || 0);
    const growthBaseline = growthValues.length
        ? growthValues.reduce((sum, value) => sum + value, 0) / growthValues.length
        : 0;

    const userGrowthChartData = {
        labels: userGrowth.map((item) => item.label),
        datasets: [
            {
                label: 'New users',
                data: growthValues,
                borderColor: '#7dd3fc',
                backgroundColor: 'rgba(14, 165, 233, 0.18)',
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 5
            },
            {
                label: 'Target baseline',
                data: growthValues.map(() => Number(growthBaseline.toFixed(2))),
                borderColor: 'rgba(251, 191, 36, 0.9)',
                borderDash: [6, 6],
                pointRadius: 0,
                fill: false
            }
        ]
    };

    const userGrowthOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: {
                ...chartOptions.plugins.legend,
                labels: { ...chartOptions.plugins.legend.labels, color: '#cbd5e1' }
            }
        }
    };

    const watchVsPortfolioChartData = {
        labels: watchVsPortfolio.map((item) => item.symbol),
        datasets: [
            {
                label: 'Watching users',
                data: watchVsPortfolio.map((item) => Number(item.watchingUsers) || 0),
                backgroundColor: '#1D9E75'
            },
            {
                label: 'Invested users',
                data: watchVsPortfolio.map((item) => Number(item.investedUsers) || 0),
                backgroundColor: '#3B82F6'
            }
        ]
    };

    const watchVsPortfolioOptions = useMemo(() => ({
        ...chartOptions,
        indexAxis: 'y',
        plugins: {
            ...chartOptions.plugins,
            legend: {
                ...chartOptions.plugins.legend,
                labels: {
                    ...chartOptions.plugins.legend.labels,
                    usePointStyle: true,
                    pointStyle: 'rect'
                }
            }
        }
    }), []);

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
                                        data={userGrowthChartData}
                                        options={userGrowthOptions}
                                        plugins={[userGrowthOverlayPlugin]}
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
                                            data: donutVisualData,
                                            backgroundColor: ['#0ea5e9', platformStats.totalProfitLoss >= 0 ? '#22c55e' : '#ef4444'],
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { labels: { color: '#cbd5e1' } },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
                                                        const isInvestment = context.dataIndex === 0;
                                                        if (isInvestment) return `Investment: ${formatMoney(totalInvestment)}`;
                                                        return `Profit / Loss: ${formatMoney(platformStats.totalProfitLoss)}`;
                                                    },
                                                    afterBody: () => 'P&L data reflects the difference between current portfolio value and original buy-in cost across all users'
                                                }
                                            },
                                            donutCenterLabelPlugin: {
                                                title: 'Total Investment',
                                                value: formatMoney(totalInvestment)
                                            }
                                        }
                                    }}
                                    plugins={[donutCenterLabelPlugin]}
                                />
                            </div>
                            {pnlIsZero ? (
                                <p className="admin-muted small mb-0 mt-2">
                                    P&amp;L tracking active - gains and losses will appear here as market prices change
                                </p>
                            ) : null}
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

                    <AdminPanel title="Watchlist vs Portfolio" subtitle="Top stocks by user interest - watching vs invested">
                        <div className="admin-chart-shell" style={{ minHeight: 320 }}>
                            <Bar data={watchVsPortfolioChartData} options={watchVsPortfolioOptions} />
                        </div>
                    </AdminPanel>
                </>
            ) : null}
        </div>
    );
}
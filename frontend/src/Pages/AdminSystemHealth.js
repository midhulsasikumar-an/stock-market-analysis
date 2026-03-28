import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import {
    AdminPageHeader,
    AdminPanel,
    AdminStatCard,
    AdminStatusPill,
    formatMoney
} from '../components/admin/AdminUI';

function formatUptime(seconds) {
    const safeSeconds = Math.max(Math.floor(Number(seconds) || 0), 0);
    const d = Math.floor(safeSeconds / 86400);
    const h = Math.floor((safeSeconds % 86400) / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    const s = Math.floor(safeSeconds % 60);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export default function AdminSystemHealth() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const uptimeSeconds = health?.express?.uptimeSeconds ?? health?.express?.uptime;
    const uptimeFormatted = health?.express?.uptimeFormatted || formatUptime(uptimeSeconds);

    useEffect(() => {
        let active = true;

        const loadHealth = async () => {
            setLoading(true);
            try {
                const response = await adminService.getSystemHealth();
                if (active) {
                    setHealth(response.data);
                    setError('');
                }
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadHealth();
        const interval = setInterval(loadHealth, 30000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div>
            <AdminPageHeader
                eyebrow="Runtime diagnostics"
                title="System Health"
                description="Monitor MongoDB, Express uptime, Finnhub connectivity, and live latency metrics from the admin tier."
                actions={<button type="button" className="admin-outline-button" onClick={() => window.location.reload()}>Refresh page</button>}
            />

            {error ? <p className="text-danger mb-3">{error}</p> : null}

            {loading && !health ? <AdminPanel><p className="admin-muted mb-0">Checking system health...</p></AdminPanel> : null}

            {health ? (
                <>
                    <div className="admin-metrics-grid" style={{ marginBottom: 16 }}>
                        <AdminStatCard label="Response Latency" value={`${health.metrics?.responseLatency || 0} ms`} />
                        <AdminStatCard label="Average Trade Value" value={formatMoney(health.metrics?.averageTradeValue || 0)} />
                        <AdminStatCard label="Active Users 30D" value={health.metrics?.activeUsers30d || 0} />
                        <AdminStatCard
                            label="API Uptime"
                            value={uptimeFormatted}
                            helper="since last server restart"
                        />
                    </div>

                    <div className="admin-grid admin-grid-three">
                        <AdminPanel title="MongoDB status">
                            <div className="admin-health-card">
                                <div>
                                    <strong>Cluster connection</strong>
                                    <div className="admin-muted">Latency {health.mongo?.latency || 0} ms</div>
                                </div>
                                <AdminStatusPill value={health.mongo?.status || 'Unknown'} />
                            </div>
                        </AdminPanel>

                        <AdminPanel title="Express API uptime">
                            <div className="admin-health-card">
                                <div>
                                    <strong>Core API process — {uptimeFormatted} uptime</strong>
                                    <div className="admin-muted">since last server restart</div>
                                </div>
                                <AdminStatusPill value={health.express?.status || 'Unknown'} />
                            </div>
                        </AdminPanel>

                        <AdminPanel title="Finnhub connection">
                            <div className="admin-health-card">
                                <div>
                                    <strong>Market data provider</strong>
                                    <div className="admin-muted">Latency {health.finnhub?.latency ?? 'n/a'} ms</div>
                                </div>
                                <AdminStatusPill value={health.finnhub?.status || 'Unknown'} />
                            </div>
                        </AdminPanel>
                    </div>
                </>
            ) : null}
        </div>
    );
}
import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import {
    AdminPageHeader,
    AdminPanel,
    AdminStatCard,
    AdminStatusPill,
    formatMoney,
    formatDateTime
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

function getLatencyState(latency) {
    const value = Number(latency);
    if (!Number.isFinite(value) || value < 0) {
        return {
            label: 'Unknown',
            color: '#94a3b8',
            background: 'rgba(148, 163, 184, 0.18)',
            border: '1px solid rgba(148, 163, 184, 0.45)',
            isCritical: false,
            displayMs: 'n/a'
        };
    }

    if (value < 300) {
        return {
            label: 'Fast',
            color: '#34d399',
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            isCritical: false,
            displayMs: `${value}ms`
        };
    }

    if (value <= 700) {
        return {
            label: 'Slow',
            color: '#fbbf24',
            background: 'rgba(245, 158, 11, 0.18)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            isCritical: false,
            displayMs: `${value}ms`
        };
    }

    return {
        label: 'Critical',
        color: '#fca5a5',
        background: 'rgba(239, 68, 68, 0.18)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        isCritical: true,
        displayMs: `${value}ms`
    };
}

export default function AdminSystemHealth() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checkedAt, setCheckedAt] = useState(null);

    const uptimeSeconds = health?.express?.uptimeSeconds ?? health?.express?.uptime;
    const uptimeFormatted = health?.express?.uptimeFormatted || formatUptime(uptimeSeconds);
    const mongoLatency = health?.mongo?.latency;
    const expressLatency = health?.metrics?.responseLatency;
    const finnhubLatency = health?.finnhub?.latency;

    const mongoLatencyState = getLatencyState(mongoLatency);
    const expressLatencyState = getLatencyState(expressLatency);
    const finnhubLatencyState = getLatencyState(finnhubLatency);

    const criticalService = [
        { name: 'MongoDB', latency: mongoLatency, state: mongoLatencyState },
        { name: 'Express API', latency: expressLatency, state: expressLatencyState },
        { name: 'Finnhub', latency: finnhubLatency, state: finnhubLatencyState }
    ].find((service) => service.state.isCritical);

    const lastCheckedValue = health?.metrics?.serverTime || checkedAt;

    useEffect(() => {
        let active = true;

        const loadHealth = async () => {
            setLoading(true);
            try {
                const response = await adminService.getSystemHealth();
                if (active) {
                    setHealth(response.data);
                    setCheckedAt(new Date().toISOString());
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
                    {criticalService ? (
                        <div
                            style={{
                                marginBottom: 16,
                                padding: '12px 14px',
                                borderRadius: 10,
                                border: '1px solid rgba(248, 113, 113, 0.45)',
                                background: 'rgba(127, 29, 29, 0.35)',
                                color: '#fecaca',
                                fontWeight: 600
                            }}
                        >
                            {`Warning: ${criticalService.name} is experiencing high latency (${criticalService.latency}ms). Stock data may be delayed.`}
                        </div>
                    ) : null}

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
                                    <div className="admin-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{`Latency ${mongoLatencyState.displayMs}`}</span>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                borderRadius: 999,
                                                padding: '2px 8px',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: '0.02em',
                                                color: mongoLatencyState.color,
                                                background: mongoLatencyState.background,
                                                border: mongoLatencyState.border
                                            }}
                                        >
                                            {mongoLatencyState.label}
                                        </span>
                                    </div>
                                    <div className="admin-muted">Last checked: {formatDateTime(lastCheckedValue)}</div>
                                </div>
                                <AdminStatusPill value={health.mongo?.status || 'Unknown'} />
                            </div>
                        </AdminPanel>

                        <AdminPanel title="Express API uptime">
                            <div className="admin-health-card">
                                <div>
                                    <strong>Core API process — {uptimeFormatted} uptime</strong>
                                    <div className="admin-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{`Latency ${expressLatencyState.displayMs}`}</span>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                borderRadius: 999,
                                                padding: '2px 8px',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: '0.02em',
                                                color: expressLatencyState.color,
                                                background: expressLatencyState.background,
                                                border: expressLatencyState.border
                                            }}
                                        >
                                            {expressLatencyState.label}
                                        </span>
                                    </div>
                                    <div className="admin-muted">Last checked: {formatDateTime(lastCheckedValue)}</div>
                                </div>
                                <AdminStatusPill value={health.express?.status || 'Unknown'} />
                            </div>
                        </AdminPanel>

                        <AdminPanel title="Finnhub connection">
                            <div className="admin-health-card">
                                <div>
                                    <strong>Market data provider</strong>
                                    <div className="admin-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{`Latency ${finnhubLatencyState.displayMs}`}</span>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                borderRadius: 999,
                                                padding: '2px 8px',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: '0.02em',
                                                color: finnhubLatencyState.color,
                                                background: finnhubLatencyState.background,
                                                border: finnhubLatencyState.border
                                            }}
                                        >
                                            {finnhubLatencyState.label}
                                        </span>
                                    </div>
                                    <div className="admin-muted">Last checked: {formatDateTime(lastCheckedValue)}</div>
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
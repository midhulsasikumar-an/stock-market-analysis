import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    AdminStatusPill,
    formatDateTime
} from '../components/admin/AdminUI';

function getCategoryBadgeStyle(category = '') {
    const normalized = String(category || '').toLowerCase();

    if (normalized === 'admin') {
        return {
            background: 'rgba(99, 102, 241, 0.22)',
            color: '#c7d2fe',
            border: '1px solid rgba(99, 102, 241, 0.5)'
        };
    }

    if (normalized === 'trade') {
        return {
            background: 'rgba(16, 185, 129, 0.16)',
            color: '#6ee7b7',
            border: '1px solid rgba(16, 185, 129, 0.45)'
        };
    }

    if (normalized === 'registration') {
        return {
            background: 'rgba(14, 165, 233, 0.16)',
            color: '#7dd3fc',
            border: '1px solid rgba(14, 165, 233, 0.45)'
        };
    }

    return {
        background: 'rgba(148, 163, 184, 0.18)',
        color: '#cbd5e1',
        border: '1px solid rgba(148, 163, 184, 0.45)'
    };
}

function formatCategoryLabel(category = '') {
    if (!category) return 'Unknown';
    return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function AdminActivityLogs() {
    const [category, setCategory] = useState('all');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        adminService.getActivityLogs({ type: category, limit: 100 })
            .then((response) => {
                setLogs(response.data || []);
                setError('');
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [category]);

    return (
        <div>
            <AdminPageHeader
                eyebrow="Platform audit trail"
                title="Activity Logs"
                description="Review trade events, user registrations, and admin-originated actions in one chronological stream."
                actions={(
                    <select className="admin-select" value={category} onChange={(event) => setCategory(event.target.value)}>
                        <option value="all">All events</option>
                        <option value="trade">Trades</option>
                        <option value="registration">Registrations</option>
                        <option value="admin">Admin actions</option>
                    </select>
                )}
            />

            <AdminPanel title="Recent events" subtitle="Newest platform activity first">
                {error ? <p className="text-danger mb-3">{error}</p> : null}

                {loading ? (
                    <p className="admin-muted mb-0">Loading activity logs...</p>
                ) : logs.length === 0 ? (
                    <AdminEmptyState title="No events recorded" description="Change the filter or wait for new platform activity." />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-data-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Actor</th>
                                    <th>Message</th>
                                    <th>Severity</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log._id}>
                                        <td>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    borderRadius: 999,
                                                    padding: '3px 10px',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    letterSpacing: '0.01em',
                                                    ...getCategoryBadgeStyle(log.category)
                                                }}
                                            >
                                                {formatCategoryLabel(log.category)}
                                            </span>
                                        </td>
                                        <td>{log.actor}</td>
                                        <td>{log.message}</td>
                                        <td><AdminStatusPill value={log.severity} /></td>
                                        <td>{formatDateTime(log.timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminPanel>
        </div>
    );
}
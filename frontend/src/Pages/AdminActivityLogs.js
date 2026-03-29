import React, { useEffect, useMemo, useState } from 'react';
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
    const [fromDateInput, setFromDateInput] = useState('');
    const [toDateInput, setToDateInput] = useState('');
    const [appliedFromDate, setAppliedFromDate] = useState('');
    const [appliedToDate, setAppliedToDate] = useState('');

    useEffect(() => {
        setLoading(true);
        adminService.getActivityLogs({ type: 'all', limit: 200, fromDate: appliedFromDate, toDate: appliedToDate })
            .then((response) => {
                setLogs(response.data || []);
                setError('');
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [appliedFromDate, appliedToDate]);

    const categoryCounts = useMemo(() => {
        const counts = {
            all: logs.length,
            trade: 0,
            registration: 0,
            admin: 0,
            security: 0
        };

        logs.forEach((log) => {
            const key = String(log.category || '').toLowerCase();
            if (key in counts && key !== 'all') {
                counts[key] += 1;
            }
        });

        return counts;
    }, [logs]);

    const filteredLogs = useMemo(() => {
        const source = category === 'all'
            ? logs
            : logs.filter((log) => String(log.category || '').toLowerCase() === category);

        return [...source].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [logs, category]);

    const filterTabs = [
        { key: 'all', label: 'All', count: categoryCounts.all },
        { key: 'trade', label: 'Trade', count: categoryCounts.trade },
        { key: 'registration', label: 'Registration', count: categoryCounts.registration },
        { key: 'admin', label: 'Admin', count: categoryCounts.admin },
        { key: 'security', label: 'Security', count: categoryCounts.security }
    ];

    const handleApplyFilter = () => {
        setAppliedFromDate(fromDateInput);
        setAppliedToDate(toDateInput);
    };

    const handleClearFilter = () => {
        setFromDateInput('');
        setToDateInput('');
        setAppliedFromDate('');
        setAppliedToDate('');
        setCategory('all');
    };

    return (
        <div>
            <AdminPageHeader
                eyebrow="Platform audit trail"
                title="Activity Logs"
                description="Review trade events, user registrations, and admin-originated actions in one chronological stream."
            />

            <AdminPanel title="Recent events" subtitle="Newest platform activity first">
                <div className="admin-actions-row" style={{ gridTemplateColumns: '2fr 2fr auto auto', marginBottom: 16 }}>
                    <div>
                        <label className="admin-help-text" htmlFor="activity-from-date">From date</label>
                        <input
                            id="activity-from-date"
                            type="date"
                            className="admin-date-input"
                            value={fromDateInput}
                            onChange={(event) => setFromDateInput(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="admin-help-text" htmlFor="activity-to-date">To date</label>
                        <input
                            id="activity-to-date"
                            type="date"
                            className="admin-date-input"
                            value={toDateInput}
                            onChange={(event) => setToDateInput(event.target.value)}
                        />
                    </div>
                    <button type="button" className="admin-primary-button" onClick={handleApplyFilter}>
                        Apply filter
                    </button>
                    <button type="button" className="admin-outline-button" onClick={handleClearFilter}>
                        Clear
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 16,
                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                    paddingBottom: 4
                }}>
                    {filterTabs.map((tab) => {
                        const isActive = category === tab.key;
                        const isSecurityHot = tab.key === 'security' && tab.count > 0;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setCategory(tab.key)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: isSecurityHot
                                        ? '#fca5a5'
                                        : isActive
                                            ? '#14b8a6'
                                            : '#94a3b8',
                                    padding: '10px 14px',
                                    marginBottom: -5,
                                    borderBottom: isSecurityHot
                                        ? '3px solid #ef4444'
                                        : isActive
                                            ? '3px solid #14b8a6'
                                            : '3px solid transparent',
                                    fontWeight: isActive ? 700 : 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {`${tab.label} (${tab.count})`}
                            </button>
                        );
                    })}
                </div>

                {error ? <p className="text-danger mb-3">{error}</p> : null}

                {loading ? (
                    <p className="admin-muted mb-0">Loading activity logs...</p>
                ) : filteredLogs.length === 0 ? (
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
                                {filteredLogs.map((log) => (
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
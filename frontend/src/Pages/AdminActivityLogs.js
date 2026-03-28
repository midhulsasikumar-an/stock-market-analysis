import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    AdminStatusPill,
    formatDateTime
} from '../components/admin/AdminUI';

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
                                        <td><AdminStatusPill value={log.category} /></td>
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
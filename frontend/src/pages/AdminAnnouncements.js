import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../services/adminService';
import { notify } from '../services/notify';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    formatDateTime
} from '../components/admin/AdminUI';

const TITLE_MAX = 80;
const MESSAGE_MAX = 500;

const defaultForm = {
    title: '',
    message: '',
    target: 'all',
    severity: 'info'
};

function severityBadgeClass(severity) {
    const value = String(severity || '').toLowerCase();
    if (value === 'warning') return 'bg-warning bg-opacity-10 text-warning';
    if (value === 'maintenance') return 'bg-danger bg-opacity-10 text-danger';
    return 'bg-primary bg-opacity-10 text-primary';
}

function targetLabel(target) {
    return String(target || '').toLowerCase() === 'active' ? 'Active Users Only' : 'All Users';
}

export default function AdminAnnouncements() {
    const [form, setForm] = useState(defaultForm);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [expiringId, setExpiringId] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState('');

    const titleCount = form.title.length;
    const messageCount = form.message.length;

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [history]);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const response = await adminService.getAnnouncements();
            setHistory(Array.isArray(response.data) ? response.data : []);
            setError('');
        } catch (err) {
            const message = err.message || 'Failed to load announcements';
            setError(message);
            notify.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const handleChange = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSend = async () => {
        const title = form.title.trim();
        const message = form.message.trim();

        if (!title || !message) {
            notify.error('Title and message are required');
            return;
        }

        setSending(true);
        setConfirmation('');
        try {
            const response = await adminService.createAnnouncement({
                title,
                message,
                target: form.target,
                severity: form.severity
            });

            const recipients = response.meta?.recipientCount ?? 0;
            const sentAt = response.meta?.sentAt || new Date().toISOString();

            setConfirmation(`Announcement sent to ${recipients} users at ${new Date(sentAt).toLocaleString()}`);
            notify.success('Announcement broadcast successfully');
            setForm(defaultForm);

            if (response.data) {
                setHistory((current) => [response.data, ...current]);
            } else {
                loadAnnouncements();
            }
        } catch (err) {
            const messageText = err.message || 'Failed to send announcement';
            setError(messageText);
            notify.error(messageText);
        } finally {
            setSending(false);
        }
    };

    const handleExpire = async (announcement) => {
        if (!announcement?._id || !announcement.isActive) return;

        setExpiringId(announcement._id);
        try {
            await adminService.expireAnnouncement(announcement._id);
            setHistory((current) => current.map((item) => item._id === announcement._id
                ? { ...item, isActive: false, expiredAt: new Date().toISOString() }
                : item));
            notify.success('Announcement expired');
        } catch (err) {
            const messageText = err.message || 'Failed to expire announcement';
            setError(messageText);
            notify.error(messageText);
        } finally {
            setExpiringId('');
        }
    };

    return (
        <div>
            <AdminPageHeader
                eyebrow="System broadcasts"
                title="Announcements"
                description="Broadcast messages to all platform users"
            />

            {error ? <p className="text-danger mb-3">{error}</p> : null}

            <AdminPanel title="Create Announcement" subtitle="Send a new broadcast message" className="mb-4">
                <div className="admin-settings-grid" style={{ marginBottom: 14 }}>
                    <div>
                        <label className="admin-help-text" htmlFor="announcement-title">Title</label>
                        <input
                            id="announcement-title"
                            type="text"
                            maxLength={TITLE_MAX}
                            className="admin-form-control"
                            value={form.title}
                            onChange={(event) => handleChange('title', event.target.value)}
                            placeholder="Announcement title"
                        />
                        <div className="admin-muted small mt-1">{titleCount}/{TITLE_MAX}</div>
                    </div>

                    <div>
                        <label className="admin-help-text" htmlFor="announcement-target">Target audience</label>
                        <select
                            id="announcement-target"
                            className="admin-select"
                            value={form.target}
                            onChange={(event) => handleChange('target', event.target.value)}
                        >
                            <option value="all">All Users</option>
                            <option value="active">Active Users Only</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label className="admin-help-text" htmlFor="announcement-message">Message</label>
                    <textarea
                        id="announcement-message"
                        maxLength={MESSAGE_MAX}
                        className="admin-form-control"
                        value={form.message}
                        onChange={(event) => handleChange('message', event.target.value)}
                        rows={5}
                        placeholder="Broadcast message"
                    />
                    <div className="admin-muted small mt-1">{messageCount}/{MESSAGE_MAX}</div>
                </div>

                <div className="admin-settings-grid" style={{ alignItems: 'end' }}>
                    <div>
                        <label className="admin-help-text" htmlFor="announcement-severity">Severity</label>
                        <select
                            id="announcement-severity"
                            className="admin-select"
                            value={form.severity}
                            onChange={(event) => handleChange('severity', event.target.value)}
                        >
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>

                    <div className="d-flex justify-content-end">
                        <button
                            type="button"
                            className="admin-primary-button"
                            disabled={sending}
                            onClick={handleSend}
                        >
                            {sending ? 'Sending...' : 'Send Announcement'}
                        </button>
                    </div>
                </div>

                {confirmation ? <p className="text-success mt-3 mb-0">{confirmation}</p> : null}
            </AdminPanel>

            <AdminPanel title="Announcement History" subtitle="Most recent first">
                {loading ? <p className="admin-muted mb-0">Loading announcements...</p> : null}

                {!loading && sortedHistory.length === 0 ? (
                    <AdminEmptyState title="No announcements yet" description="Sent announcements will appear here with status and expiry controls." />
                ) : null}

                {!loading && sortedHistory.length > 0 ? (
                    <div className="admin-table-wrap">
                        <table className="admin-data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Message Preview</th>
                                    <th>Severity</th>
                                    <th>Target</th>
                                    <th>Date Sent</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHistory.map((item) => {
                                    const preview = item.message && item.message.length > 60
                                        ? `${item.message.slice(0, 60)}...`
                                        : item.message || '—';

                                    return (
                                        <tr key={item._id}>
                                            <td><strong>{item.title}</strong></td>
                                            <td className="admin-muted">{preview}</td>
                                            <td>
                                                <span className={`badge rounded-pill px-2 py-1 ${severityBadgeClass(item.severity)}`}>
                                                    {(item.severity || 'info').toUpperCase()}
                                                </span>
                                            </td>
                                            <td>{targetLabel(item.target)}</td>
                                            <td>{formatDateTime(item.createdAt)}</td>
                                            <td>
                                                <span className={`badge rounded-pill px-2 py-1 ${item.isActive ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-25 text-light'}`}>
                                                    {item.isActive ? 'Active' : 'Expired'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="admin-warning-button"
                                                    disabled={!item.isActive || expiringId === item._id}
                                                    onClick={() => handleExpire(item)}
                                                >
                                                    {expiringId === item._id ? 'Expiring...' : 'Expire'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </AdminPanel>
        </div>
    );
}

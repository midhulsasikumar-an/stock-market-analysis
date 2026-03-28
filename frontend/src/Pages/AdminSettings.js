import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import { AdminPageHeader, AdminPanel } from '../components/admin/AdminUI';

export default function AdminSettings() {
    const [form, setForm] = useState({
        apiRefreshInterval: 60,
        maxTradeValue: 250000,
        maxDailyTrades: 50,
        maintenanceMode: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        adminService.getPlatformSettings()
            .then((response) => {
                setForm({
                    apiRefreshInterval: response.data.apiRefreshInterval,
                    maxTradeValue: response.data.maxTradeValue,
                    maxDailyTrades: response.data.maxDailyTrades,
                    maintenanceMode: response.data.maintenanceMode
                });
                setError('');
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await adminService.updatePlatformSettings(form);
            setMessage('Platform settings saved.');
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <AdminPageHeader
                eyebrow="Control plane"
                title="Platform Settings"
                description="Persist admin-side operational settings for API refresh timing, trade limits, and maintenance mode."
            />

            <AdminPanel title="Operational settings" subtitle="These settings stay inside the admin tier.">
                {loading ? <p className="admin-muted mb-3">Loading settings...</p> : null}
                {error ? <p className="text-danger mb-3">{error}</p> : null}
                {message ? <p className="text-success mb-3">{message}</p> : null}

                <form onSubmit={handleSubmit}>
                    <div className="admin-settings-grid" style={{ marginBottom: 16 }}>
                        <label>
                            <span className="admin-help-text">API refresh interval (seconds)</span>
                            <input type="number" min="5" className="admin-form-control" value={form.apiRefreshInterval} onChange={(event) => updateField('apiRefreshInterval', Number(event.target.value))} />
                        </label>
                        <label>
                            <span className="admin-help-text">Trading limit per order (USD)</span>
                            <input type="number" min="1" className="admin-form-control" value={form.maxTradeValue} onChange={(event) => updateField('maxTradeValue', Number(event.target.value))} />
                        </label>
                        <label>
                            <span className="admin-help-text">Daily trade cap per user</span>
                            <input type="number" min="1" className="admin-form-control" value={form.maxDailyTrades} onChange={(event) => updateField('maxDailyTrades', Number(event.target.value))} />
                        </label>
                    </div>

                    <div className="admin-toggle-row" style={{ marginBottom: 16 }}>
                        <div>
                            <strong>Maintenance mode</strong>
                            <div className="admin-muted">Keep this inside admin controls. This does not expose navigation to the user tier.</div>
                        </div>
                        <button type="button" className={`admin-toggle ${form.maintenanceMode ? 'is-on' : ''}`} onClick={() => updateField('maintenanceMode', !form.maintenanceMode)} aria-label="Toggle maintenance mode" />
                    </div>

                    <button type="submit" className="admin-primary-button" disabled={saving || loading}>
                        {saving ? 'Saving...' : 'Save settings'}
                    </button>
                </form>
            </AdminPanel>
        </div>
    );
}
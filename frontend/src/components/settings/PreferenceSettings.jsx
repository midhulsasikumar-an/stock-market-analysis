import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PreferenceSettings() {
    const { user } = useAuth();
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user && user.preferences) {
            setTheme(user.preferences.theme || 'dark');
            setNotifications(user.preferences.notifications !== false);
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch(`${API_URL}/api/profile/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authService.getAuthHeaders().Authorization
                },
                body: JSON.stringify({ theme, notifications })
            });

            const data = await res.json();

            if (data.success) {
                setMessage('Preferences saved successfully!');

                // Update local storage user preferences
                const updatedUser = { ...user, preferences: data.preferences };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.message || 'Error updating preferences');
            }
        } catch (error) {
            setMessage('Failed to connect to server');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 bg-glass rounded">
            <h2 className="text-xl fw-bold text-white mb-4">User Preferences</h2>

            {message && (
                <div className="alert alert-success p-2 small mb-4 rounded opacity-75">
                    {message}
                </div>
            )}

            <div className="d-flex flex-column gap-4">
                <div className="border border-secondary border-opacity-25 rounded p-3 bg-white bg-opacity-10">
                    <h5 className="text-white fs-6 mb-3">Theme Settings</h5>
                    <div className="d-flex flex-column gap-2 mb-2">
                        <label className="d-flex align-items-center gap-2 text-white">
                            <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> <span className="small">Dark Mode (Default)</span>
                        </label>
                        <label className="d-flex align-items-center gap-2 text-muted">
                            <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} disabled /> <span className="small">Light Mode (Coming Soon)</span>
                        </label>
                    </div>
                </div>

                <div className="border border-secondary border-opacity-25 rounded p-3 bg-white bg-opacity-10">
                    <h5 className="text-white fs-6 mb-3">Notifications</h5>
                    <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" id="flexSwitchCheckChecked" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                        <label className="form-check-label text-white small ms-2" htmlFor="flexSwitchCheckChecked">Enable System Notifications</label>
                        <p className="text-muted m-0 mt-1" style={{ fontSize: '0.7rem' }}>Receive alerts on stock prices and major market moves.</p>
                    </div>
                </div>

                <div className="d-flex justify-content-end mt-2">
                    <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary px-4 py-2 fw-bold text-white rounded">
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';

export default function PreferenceSettings() {
    const [preferences, setPreferences] = useState({
        theme: 'dark',
        notifications: true,
        landingPage: 'dashboard',
        compactView: false
    });
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        // In a real app, we'd persist this to localStorage or API
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const togglePreference = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="settings-content-inner">
            <div className="settings-header-box">
                <h3 className="settings-title">Preferences</h3>
                <p className="settings-subtitle">Customize your dashboard experience and notifications.</p>
            </div>

            <form onSubmit={handleSave} className="settings-form">
                <div className="preference-list">
                    <div className="preference-item bg-glass">
                        <div className="pref-info">
                            <span className="pref-label">Dark Mode</span>
                            <p className="pref-desc">Use the dark theme across the entire application.</p>
                        </div>
                        <div className="pref-control">
                            <div
                                className={`toggle-switch ${preferences.theme === 'dark' ? 'active' : ''}`}
                                onClick={() => setPreferences(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}
                            >
                                <div className="toggle-knob"></div>
                            </div>
                        </div>
                    </div>

                    <div className="preference-item bg-glass">
                        <div className="pref-info">
                            <span className="pref-label">Email Notifications</span>
                            <p className="pref-desc">Receive weekly market summaries and price alerts.</p>
                        </div>
                        <div className="pref-control">
                            <div
                                className={`toggle-switch ${preferences.notifications ? 'active' : ''}`}
                                onClick={() => togglePreference('notifications')}
                            >
                                <div className="toggle-knob"></div>
                            </div>
                        </div>
                    </div>

                    <div className="preference-item bg-glass">
                        <div className="pref-info">
                            <span className="pref-label">Compact Watchlist</span>
                            <p className="pref-desc">Show more items in the watchlist by reducing spacing.</p>
                        </div>
                        <div className="pref-control">
                            <div
                                className={`toggle-switch ${preferences.compactView ? 'active' : ''}`}
                                onClick={() => togglePreference('compactView')}
                            >
                                <div className="toggle-knob"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-form-group mt-lg">
                    <label className="settings-label">Default Landing Page</label>
                    <select
                        className="form-control bg-glass"
                        value={preferences.landingPage}
                        onChange={(e) => setPreferences(prev => ({ ...prev, landingPage: e.target.value }))}
                    >
                        <option value="dashboard">Dashboard Overview</option>
                        <option value="stocks">Stock Explorer</option>
                        <option value="news">Market News</option>
                    </select>
                </div>

                <div className="settings-actions-bar mt-xl">
                    <button type="submit" className={`btn-accent ${isSaved ? 'btn-success' : ''}`}>
                        {isSaved ? '✓ Preferences Saved' : 'Save Preferences'}
                    </button>
                </div>
            </form>
        </div>
    );
}

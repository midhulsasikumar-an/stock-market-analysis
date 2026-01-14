import React, { useState } from 'react';

export default function SecuritySettings() {
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePasswordChange = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwords.new !== passwords.confirm) {
            setError('New passwords do not match');
            return;
        }

        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Find user in full list to check current password
        const userIndex = users.findIndex(u => u.username === user.username);

        if (userIndex === -1 || users[userIndex].password !== passwords.current) {
            setError('Current password is incorrect');
            return;
        }

        // Update password
        users[userIndex].password = passwords.new;
        localStorage.setItem('users', JSON.stringify(users));

        // Also update currentUser
        const updatedUser = { ...user, password: passwords.new };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        setSuccess('Password changed successfully!');
        setPasswords({ current: '', new: '', confirm: '' });
    };

    const logoutAllSessions = () => {
        // In this local-only app, this just logs out the current user
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    return (
        <div className="settings-content-inner">
            <div className="settings-header-box">
                <h3 className="settings-title">Security Settings</h3>
                <p className="settings-subtitle">Protect your account and manage active sessions.</p>
            </div>

            <form onSubmit={handlePasswordChange} className="settings-form">
                <h4 className="mb-md text-sm font-semibold text-uppercase text-muted">Change Password</h4>

                {error && <div className="alert alert-danger py-2 mb-md small">{error}</div>}
                {success && <div className="alert alert-success py-2 mb-md small">{success}</div>}

                <div className="settings-form-grid">
                    <div className="settings-form-group">
                        <label className="settings-label">Current Password</label>
                        <input
                            type="password"
                            className="form-control bg-glass"
                            value={passwords.current}
                            onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="settings-form-group">
                        <label className="settings-label">New Password</label>
                        <input
                            type="password"
                            className="form-control bg-glass"
                            value={passwords.new}
                            onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="settings-form-group">
                        <label className="settings-label">Confirm New Password</label>
                        <input
                            type="password"
                            className="form-control bg-glass"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                <div className="settings-actions-bar mt-lg">
                    <button type="submit" className="btn-accent">Update Password</button>
                </div>
            </form>

            <div className="divider-lg my-xl"></div>

            <div className="sessions-section">
                <h4 className="mb-md text-sm font-semibold text-uppercase text-muted">Global Access</h4>
                <div className="bg-glass p-md rounded-md flex-between">
                    <div>
                        <span className="font-semibold d-block">Logout from all devices</span>
                        <p className="text-xs text-muted mb-0">This will sign you out from all other browsers and devices.</p>
                    </div>
                    <button
                        type="button"
                        className="btn-glass text-danger border-danger-subtle"
                        onClick={logoutAllSessions}
                    >
                        Logout Everywhere
                    </button>
                </div>
            </div>
        </div>
    );
}

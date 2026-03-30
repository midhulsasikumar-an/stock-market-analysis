import React, { useState } from 'react';
import authService from '../../services/authService';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function SecuritySettings() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Placeholder 2FA feature
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`${API_URL}/api/profile/security`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authService.getAuthHeaders().Authorization
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Password updated securely!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Error updating password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 bg-glass rounded">
            <h2 className="text-xl fw-bold text-white mb-4">Security Settings</h2>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} p-2 small mb-4 rounded opacity-75`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-5">
                <div className="bg-dark p-3 rounded mb-4" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h5 className="text-white fs-6 mb-3">Change Password</h5>
                    <div className="mb-3">
                        <label className="form-label text-muted small mb-1">Current Password *</label>
                        <input type="password" required className="form-control bg-transparent text-white border-secondary" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small mb-1">New Password *</label>
                        <input type="password" required className="form-control bg-transparent text-white border-secondary" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small mb-1">Confirm New Password *</label>
                        <input type="password" required className="form-control bg-transparent text-white border-secondary" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>

                    <button type="submit" disabled={saving} className="btn btn-primary px-4 py-2 mt-2 fw-bold text-white rounded">
                        {saving ? 'Validating...' : 'Update Password'}
                    </button>
                </div>
            </form>

            <div className="bg-dark p-3 rounded mb-4" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <h5 className="text-white fs-6 mb-3">Two-Factor Authentication</h5>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <p className="text-muted small m-0">Add an extra layer of security to your account.</p>
                        <span className={`badge ${twoFactorEnabled ? 'bg-success' : 'bg-warning'} mt-2 rounded`}>
                            {twoFactorEnabled ? 'Enabled' : 'Not Configured'}
                        </span>
                    </div>
                    <button
                            type="button"
                            className="btn btn-outline-warning btn-sm px-3 fw-semibold rounded-pill shadow-sm"
                            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        >
                            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>
                </div>
            </div>
        </div>
    );
}

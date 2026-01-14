import React from 'react';

export default function AccountSettings() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Mock some account data since it's not in the original schema
    const accountInfo = {
        role: user.role || 'Standard User',
        joinedDate: user.joinedDate || 'January 14, 2026',
        status: 'Active',
        subscription: 'Free Plan'
    };

    return (
        <div className="settings-content-inner">
            <div className="settings-header-box">
                <h3 className="settings-title">Account Details</h3>
                <p className="settings-subtitle">Manage your account status and subscription preferences.</p>
            </div>

            <div className="account-info-grid">
                <div className="info-card bg-glass">
                    <span className="info-label">Account Role</span>
                    <span className="info-value text-primary">{accountInfo.role}</span>
                </div>

                <div className="info-card bg-glass">
                    <span className="info-label">Member Since</span>
                    <span className="info-value">{accountInfo.joinedDate}</span>
                </div>

                <div className="info-card bg-glass">
                    <span className="info-label">Account Status</span>
                    <span className="info-value status-active">{accountInfo.status}</span>
                </div>

                <div className="info-card bg-glass">
                    <span className="info-label">Subscription</span>
                    <span className="info-value">{accountInfo.subscription}</span>
                </div>
            </div>

            <div className="danger-zone mt-xl">
                <h4 className="text-danger mb-md">Danger Zone</h4>
                <div className="danger-card border-danger bg-danger-subtle">
                    <div className="danger-info">
                        <span className="font-semibold">Deactivate Account</span>
                        <p className="text-xs text-muted mb-0">Permanently delete your account and all your data. This action cannot be undone.</p>
                    </div>
                    <button className="btn-danger-outline">Deactivate</button>
                </div>
            </div>
        </div>
    );
}

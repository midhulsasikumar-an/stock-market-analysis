import React from 'react';
import ProfileSettings from '../components/settings/ProfileSettings';

export default function Profile() {
    return (
        <div className="settings-page-container">
            <div className="settings-header-box border-0">
                <h1 className="settings-title text-2xl">My Profile</h1>
                <p className="settings-subtitle">Manage your public profile and personal information.</p>
            </div>

            <div className="settings-content-card bg-glass rounded-lg">
                <ProfileSettings />
            </div>
        </div>
    );
}

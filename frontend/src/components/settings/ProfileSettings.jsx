import React, { useState } from 'react';

export default function ProfileSettings() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    const [fullName, setFullName] = useState(user.fullName || '');
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        const updatedUser = { ...user, fullName };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Also update in users list to persist across sessions
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.map(u => u.username === user.username ? { ...u, fullName } : u);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        setUser(updatedUser);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);

        // Custom event to notify other components (like Navbar)
        window.dispatchEvent(new Event('userUpdate'));
    };

    const initials = user.username
        ? user.username.split('@')[0].substring(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="settings-content-inner">
            <div className="settings-header-box">
                <h3 className="settings-title">Profile Information</h3>
                <p className="settings-subtitle">Update your personal details and profile picture.</p>
            </div>

            <form onSubmit={handleSave} className="settings-form">
                <div className="profile-upload-section mb-xl">
                    <div className="large-profile-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="large-avatar-img" />
                        ) : (
                            <span className="large-avatar-initials">{initials}</span>
                        )}
                        <div className="avatar-edit-badge">
                            <span role="img" aria-label="edit">📷</span>
                        </div>
                    </div>
                    <div className="upload-controls">
                        <button type="button" className="btn-glass text-sm">Change Photo</button>
                        <p className="text-xs text-muted mt-sm">Recommended: Square image, at least 400x400px.</p>
                    </div>
                </div>

                <div className="settings-form-grid">
                    <div className="settings-form-group">
                        <label className="settings-label">Full Name</label>
                        <input
                            type="text"
                            className="form-control bg-glass"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="settings-form-group">
                        <label className="settings-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control bg-glass readonly-input"
                            value={user.username || ''}
                            readOnly
                            disabled
                        />
                        <p className="input-hint">Email address is used for login and cannot be changed.</p>
                    </div>
                </div>

                <div className="settings-actions-bar mt-xl">
                    <button type="submit" className={`btn-accent ${isSaved ? 'btn-success' : ''}`}>
                        {isSaved ? '✓ Profile Updated' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfileAvatar() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const initials = user.username
        ? user.username.split('@')[0].substring(0, 2).toUpperCase()
        : 'U';

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/');
        // Force a reload or update to clear local state if necessary
        window.location.reload();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="profile-avatar-container" ref={dropdownRef}>
            <button
                className="profile-avatar-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className="profile-avatar">
                    {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="avatar-img" />
                    ) : (
                        <span className="avatar-initials">{initials}</span>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="profile-dropdown bg-glass">
                    <div className="dropdown-user-info">
                        <span className="dropdown-username">{user.fullName || user.username.split('@')[0]}</span>
                        <span className="dropdown-email">{user.username}</span>
                    </div>
                    <div className="dropdown-divider"></div>

                    <Link to="/dashboard/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <span className="dropdown-icon">👤</span>
                        <span>My Profile</span>
                    </Link>

                    <Link to="/dashboard/settings" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <span className="dropdown-icon">⚙️</span>
                        <span>Settings</span>
                    </Link>

                    <Link to="/dashboard/settings?tab=preferences" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <span className="dropdown-icon">🛠️</span>
                        <span>Preferences</span>
                    </Link>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <span className="dropdown-icon">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
}

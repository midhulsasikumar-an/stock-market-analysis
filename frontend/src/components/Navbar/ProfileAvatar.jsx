import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProfileAvatar
 * Shows initials (first 2 letters of email before @) or profile image.
 * Reads from AuthContext (which validates the JWT against the server).
 * Logout calls authService via context so all state is cleaned up properly.
 */
export default function ProfileAvatar() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Derive initials safely — user may be null while session is loading
    const getInitials = () => {
        if (!user) return 'U';
        // Try firstName/lastName first
        if (user.firstName && user.lastName) {
            return (user.firstName[0] + user.lastName[0]).toUpperCase();
        }
        if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
        // Fall back to email prefix
        const email = user.email || '';
        return email.split('@')[0].substring(0, 2).toUpperCase() || 'U';
    };

    const initials = getInitials();
    const displayName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : (user?.email?.split('@')[0] || 'User');
    const email = user?.email || '';

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();   // clears authToken + user from localStorage via authService
        navigate('/');
    };

    // Close dropdown when clicking outside
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
                title={displayName}
            >
                <div className="profile-avatar">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="avatar-img" />
                    ) : (
                        <span className="avatar-initials">{initials}</span>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="profile-dropdown bg-glass">
                    <div className="dropdown-user-info">
                        <span className="dropdown-username">{displayName}</span>
                        {email && <span className="dropdown-email">{email}</span>}
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

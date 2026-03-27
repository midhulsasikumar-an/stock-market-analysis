import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ProfileAvatar() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Dynamic data states
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    // For tabs inside the dropdown
    const [activeTab, setActiveTab] = useState('overview'); // overview, activity, settings

    useEffect(() => {
        if (isOpen && user) {
            fetchSummary();
        }
    }, [isOpen, user]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const endpoint = user?.role === 'admin'
                ? '/api/avatar/admin-summary'
                : '/api/avatar/user-summary';

            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: authService.getAuthHeaders()
            });
            const json = await res.json();
            if (json.success) setSummary(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
        navigate('/');
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

    const getInitials = () => {
        if (!user) return 'U';
        if (user.firstName && user.lastName) return (user.firstName[0] + user.lastName[0]).toUpperCase();
        if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
        const email = user.email || '';
        return email.split('@')[0].substring(0, 2).toUpperCase() || 'U';
    };

    const initials = getInitials();
    const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.email?.split('@')[0] || 'User');
    const isAdmin = user?.role === 'admin';

    return (
        <div className="profile-avatar-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button className="profile-avatar-btn" onClick={() => setIsOpen(!isOpen)}>
                <div className="profile-avatar" style={{ border: isAdmin ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)' }}>
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="avatar-img" />
                    ) : (
                        <span className="avatar-initials">{initials}</span>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="profile-dropdown bg-glass" style={{
                    position: 'absolute', right: 0, top: '48px', width: '360px',
                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 1000,
                    backdropFilter: 'blur(16px)', background: 'rgba(15, 23, 42, 0.95)'
                }}>

                    {/* Header */}
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="profile-avatar" style={{ width: '50px', height: '50px', fontSize: '1.2rem', flexShrink: 0 }}>
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <span className="avatar-initials">{initials}</span>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h6 className="text-white fw-bold m-0 text-truncate">{displayName}</h6>
                                <p className="text-muted small m-0 text-truncate">{user?.email}</p>
                                <span className={`badge mt-1 ${isAdmin ? 'bg-primary' : 'bg-success'} bg-opacity-10 ${isAdmin ? 'text-primary' : 'text-success'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                                    {isAdmin ? 'Administrator' : 'Premium Member'}
                                </span>
                            </div>
                        </div>
                        {summary && (
                            <div className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>
                                Member since {new Date(summary.profile?.createdAt).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    {loading && !summary ? (
                        <div className="d-flex justify-content-center align-items-center py-5">
                            <span className="spinner-border spinner-border-sm text-primary"></span>
                        </div>
                    ) : summary && (
                        <>
                            {/* Tabs */}
                            <div className="d-flex border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <button className="flex-fill bg-transparent text-white border-0 py-2 small"
                                    style={{ borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent', opacity: activeTab === 'overview' ? 1 : 0.5 }}
                                    onClick={() => setActiveTab('overview')}>Overview</button>
                                <button className="flex-fill bg-transparent text-white border-0 py-2 small"
                                    style={{ borderBottom: activeTab === 'activity' ? '2px solid #3b82f6' : '2px solid transparent', opacity: activeTab === 'activity' ? 1 : 0.5 }}
                                    onClick={() => setActiveTab('activity')}>{isAdmin ? 'System' : 'Watchlist'}</button>
                                <button className="flex-fill bg-transparent text-white border-0 py-2 small"
                                    style={{ borderBottom: activeTab === 'settings' ? '2px solid #3b82f6' : '2px solid transparent', opacity: activeTab === 'settings' ? 1 : 0.5 }}
                                    onClick={() => setActiveTab('settings')}>Control</button>
                            </div>

                            {/* Tab Content */}
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">

                                {activeTab === 'overview' && (
                                    <div className="p-3">
                                        {isAdmin ? (
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <div className="p-2 rounded bg-white bg-opacity-10 text-center">
                                                        <h5 className="text-white m-0 fw-bold">{summary.platformOverview?.totalUsers}</h5>
                                                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>Users</span>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="p-2 rounded bg-white bg-opacity-10 text-center">
                                                        <h5 className="text-white m-0 fw-bold">{summary.platformOverview?.totalPortfolios}</h5>
                                                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>Portfolios</span>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="p-2 rounded bg-white bg-opacity-10 text-center">
                                                        <h5 className="text-white m-0 fw-bold">{summary.platformOverview?.totalWatchlists}</h5>
                                                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>Watchlists</span>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="p-2 rounded bg-white bg-opacity-10 text-center">
                                                        <h5 className="text-white m-0 fw-bold">{summary.platformOverview?.totalSearches}</h5>
                                                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>Queries</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex flex-column gap-2">
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted small">Portfolio Value</span>
                                                    <span className="text-white fw-bold">${summary.portfolioSummary?.currentPortfolioValue?.toLocaleString()}</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted small">Total Invested</span>
                                                    <span className="text-white fw-bold">${summary.portfolioSummary?.totalInvested?.toLocaleString()}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small">Total P&L</span>
                                                    <span className={`fw-bold px-2 py-1 rounded small ${summary.portfolioSummary?.totalPnL >= 0 ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-10`}>
                                                        {summary.portfolioSummary?.totalPnL >= 0 ? '+' : ''}${summary.portfolioSummary?.totalPnL?.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted small">Holdings</span>
                                                    <span className="text-white small fw-bold">{summary.portfolioSummary?.numStocks} Stocks</span>
                                                </div>
                                                <div className="p-2 mt-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>Best Stock</span>
                                                        <span className="text-success fw-bold" style={{ fontSize: '0.7rem' }}>{summary.portfolioSummary?.bestStock || 'N/A'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>Worst Stock</span>
                                                        <span className="text-danger fw-bold" style={{ fontSize: '0.7rem' }}>{summary.portfolioSummary?.worstStock || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <span className="text-muted small">Risk Profile</span>
                                                    <span className="badge bg-secondary text-white">{summary.analytics?.riskProfile}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="p-3">
                                        {isAdmin ? (
                                            <div className="d-flex flex-column gap-3">
                                                <h6 className="text-muted small fw-bold m-0 border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>Network Health</h6>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-white small">MongoDB</span>
                                                    <span className={`badge ${summary.system?.dbConnectivity === 'Online' ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-success`}>{summary.system?.dbConnectivity}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-white small">Finnhub API</span>
                                                    <span className={`badge ${summary.system?.apiStatus === 'Connected' ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-success`}>{summary.system?.apiStatus}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-white small">Express App</span>
                                                    <span className="badge bg-primary bg-opacity-10 text-primary">{summary.system?.serverStatus}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex flex-column gap-2">
                                                <h6 className="text-muted small fw-bold m-0 border-bottom pb-2 mb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>Watchlist Quick View</h6>
                                                {summary.watchlist?.length > 0 ? (
                                                    summary.watchlist.map(wl => (
                                                        <div key={wl.symbol} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                            <div className="text-white fw-bold small">{wl.symbol}</div>
                                                            <button className="btn btn-sm btn-outline-primary py-0" style={{ fontSize: '0.65rem' }} onClick={() => navigate(`/stock/${wl.symbol}`)}>View</button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted small text-center py-2">No stocks in watchlist</div>
                                                )}

                                                <h6 className="text-muted small fw-bold m-0 border-bottom pb-2 mt-2 mb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>Recent Notifications</h6>
                                                {summary.notifications?.length > 0 ? (
                                                    summary.notifications.map(n => (
                                                        <div key={n._id} className="small text-white p-2 rounded bg-opacity-10 bg-primary mb-1">
                                                            {n.message}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted small text-center py-2">All caught up!</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="p-2">
                                        <Link to={isAdmin ? "/admin" : "/dashboard/profile"} className="dropdown-item py-2 d-flex align-items-center gap-3 rounded mb-1" onClick={() => setIsOpen(false)}>
                                            <span className="dropdown-icon m-0 p-2 bg-secondary bg-opacity-25 rounded text-white">👤</span>
                                            <div>
                                                <div className="text-white small fw-bold">Edit Profile</div>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>Update picture and details</div>
                                            </div>
                                        </Link>
                                        <Link to={isAdmin ? "/admin" : "/dashboard/settings"} className="dropdown-item py-2 d-flex align-items-center gap-3 rounded mb-1" onClick={() => setIsOpen(false)}>
                                            <span className="dropdown-icon m-0 p-2 bg-secondary bg-opacity-25 rounded text-white">⚙️</span>
                                            <div>
                                                <div className="text-white small fw-bold">Account Security</div>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>Change password and 2FA</div>
                                            </div>
                                        </Link>
                                        <div className="dropdown-divider my-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}></div>
                                        <button className="dropdown-item text-danger py-2 d-flex align-items-center gap-3 rounded" onClick={handleLogout}>
                                            <span className="dropdown-icon m-0 p-2 bg-danger bg-opacity-25 rounded text-danger">🚪</span>
                                            <span className="small fw-bold">Sign Out securely</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Inject custom scrollbar style specifically for this dropdown if missing */}
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }`}</style>
        </div>
    );
}

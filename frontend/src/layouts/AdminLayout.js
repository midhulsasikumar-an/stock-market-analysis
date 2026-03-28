import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminConsole.css';

const navGroups = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', path: '/admin', icon: '01' }
        ]
    },
    {
        label: 'Users',
        items: [
            { label: 'User Management', path: '/admin/users', icon: '02' },
            { label: 'Portfolio Inspector', path: '/admin/portfolios', icon: '05' }
        ]
    },
    {
        label: 'Market Data',
        items: [
            { label: 'Trades Explorer', path: '/admin/trades', icon: '04' },
            { label: 'Analytics', path: '/admin/analytics', icon: '06' }
        ]
    },
    {
        label: 'System',
        items: [
            { label: 'Activity Logs', path: '/admin/activity-logs', icon: '07' },
            { label: 'System Health', path: '/admin/system-health', icon: '08' },
            { label: 'Platform Settings', path: '/admin/settings', icon: '09' },
            { label: 'Announcements', path: '/admin/announcements', icon: '10' }
        ]
    }
];

const navItems = navGroups.flatMap((group) => group.items);

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [navSearch, setNavSearch] = useState('');

    const filteredGroups = useMemo(() => {
        const searchValue = navSearch.trim().toLowerCase();

        return navGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => item.label.toLowerCase().includes(searchValue))
            }))
            .filter((group) => group.items.length > 0);
    }, [navSearch]);

    const activeLabel = useMemo(() => {
        return navItems.find((item) => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.label || 'Dashboard';
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="admin-console">
            <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
                <div className="admin-branding">
                    <div className="admin-brand-mark">TT</div>
                    <div>
                        <strong>TradeTrack</strong>
                        <span>Admin tier</span>
                    </div>
                </div>

                <div className="admin-sidebar-search">
                    <input
                        type="text"
                        className="admin-form-control"
                        placeholder="Search sections"
                        value={navSearch}
                        onChange={(event) => setNavSearch(event.target.value)}
                    />
                </div>

                <nav className="admin-nav-list">
                    {filteredGroups.map((group) => (
                        <div key={group.label} className="admin-nav-group">
                            <div className="admin-nav-section-label">{group.label}</div>
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/admin'}
                                    className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="admin-nav-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}

                    {filteredGroups.length === 0 ? (
                        <div className="admin-muted" style={{ fontSize: 13, padding: '6px 8px' }}>
                            No matching sections.
                        </div>
                    ) : null}
                </nav>

                <div className="admin-sidebar-footer">
                    <span>Locked to admin routes only</span>
                    <small>User dashboard routes redirect back here.</small>
                </div>
            </aside>

            <div className="admin-shell">
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button
                            type="button"
                            className="admin-icon-button mobile-only"
                            onClick={() => setSidebarOpen((current) => !current)}
                        >
                            Menu
                        </button>
                        <div>
                            <div className="admin-eyebrow">Admin Control Surface</div>
                            <strong>{activeLabel}</strong>
                        </div>
                    </div>

                    <div className="admin-topbar-right">
                        <input
                            type="search"
                            className="admin-form-control admin-topbar-search"
                            placeholder="Quick jump in the sidebar"
                            value={navSearch}
                            onChange={(event) => setNavSearch(event.target.value)}
                        />

                        <div className="admin-profile-card">
                            <div>
                                <strong>{user?.username || 'admin'}</strong>
                                <span>{user?.email || 'Administrator'}</span>
                            </div>
                            <button type="button" className="admin-outline-button" onClick={handleLogout}>
                                Sign out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="admin-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../services/adminService';
import { notify } from '../services/notify';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    formatDate,
    formatMoney
} from '../components/admin/AdminUI';

function getUserDisplayName(user = {}) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    const emailPrefix = typeof user.email === 'string' ? user.email.split('@')[0] : '';
    const candidates = [
        user.username,
        user.name,
        user.displayName,
        user.fullName,
        fullName,
        emailPrefix,
        'Unknown User'
    ];

    const match = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return match ? match.trim() : 'Unknown User';
}

function getUserStatus(user = {}) {
    return String(user.status || user.accountStatus || '').trim().toLowerCase();
}

function formatStatusLabel(status = '') {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusBadgeStyle(status = '') {
    if (status === 'active') {
        return {
            background: 'rgba(16, 185, 129, 0.18)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.45)'
        };
    }

    if (status === 'suspended') {
        return {
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.45)'
        };
    }

    return {
        background: 'rgba(148, 163, 184, 0.18)',
        color: '#cbd5e1',
        border: '1px solid rgba(148, 163, 184, 0.45)'
    };
}

function isNewThisWeek(user = {}) {
    const sourceDate = user.createdAt || user.joinDate;
    if (!sourceDate) return false;

    const joinedAt = new Date(sourceDate);
    if (Number.isNaN(joinedAt.getTime())) return false;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return joinedAt >= sevenDaysAgo;
}

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState('');
    const [busyAction, setBusyAction] = useState('');
    const [portfolioOpen, setPortfolioOpen] = useState(false);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [portfolioError, setPortfolioError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [portfolioData, setPortfolioData] = useState(null);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await adminService.getUsers({ search });
                setUsers(response.data || []);
                setError('');
            } catch (err) {
                const message = err.message || 'Failed to load users.';
                setError(message);
                notify.error(message);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [search]);

    const tabCounts = useMemo(() => {
        const active = users.filter((user) => getUserStatus(user) === 'active').length;
        const suspended = users.filter((user) => getUserStatus(user) === 'suspended').length;
        const newThisWeek = users.filter((user) => isNewThisWeek(user)).length;

        return {
            all: users.length,
            active,
            suspended,
            newThisWeek
        };
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (statusFilter === 'active') {
            return users.filter((user) => getUserStatus(user) === 'active');
        }

        if (statusFilter === 'suspended') {
            return users.filter((user) => getUserStatus(user) === 'suspended');
        }

        if (statusFilter === 'newThisWeek') {
            return users.filter((user) => isNewThisWeek(user));
        }

        return users;
    }, [users, statusFilter]);

    const filterTabs = [
        { key: 'all', label: 'All', count: tabCounts.all },
        { key: 'active', label: 'Active', count: tabCounts.active },
        { key: 'suspended', label: 'Suspended', count: tabCounts.suspended },
        { key: 'newThisWeek', label: 'New This Week', count: tabCounts.newThisWeek }
    ];

    const handleStatusToggle = async (user) => {
        const currentStatus = getUserStatus(user);
        const isSuspending = currentStatus === 'active';
        const nextStatus = isSuspending ? 'suspended' : 'active';
        const displayName = getUserDisplayName(user);
        const loadingMessage = isSuspending ? 'Suspending user...' : 'Reactivating user...';
        const successMessage = isSuspending
            ? `${displayName} has been suspended.`
            : `${displayName} has been reactivated.`;
        const errorMessage = isSuspending
            ? 'Failed to suspend user. Please try again.'
            : 'Failed to reactivate user.';

        const toastId = notify.loading(loadingMessage);
        setBusyId(user._id);
        setBusyAction(isSuspending ? 'suspend' : 'reactivate');

        // Optimistic status update so counts and badges refresh immediately.
        setUsers((current) => current.map((item) => item._id === user._id ? { ...item, accountStatus: nextStatus, status: nextStatus } : item));

        try {
            await adminService.updateUserStatus(user._id, nextStatus);
            notify.dismiss(toastId);
            notify.success(successMessage);
        } catch (err) {
            // Revert optimistic update when the API call fails.
            setUsers((current) => current.map((item) => item._id === user._id ? { ...item, accountStatus: currentStatus, status: currentStatus } : item));
            const message = err.message || errorMessage;
            setError(message);
            notify.dismiss(toastId);
            notify.error(errorMessage);
        } finally {
            setBusyId('');
            setBusyAction('');
        }
    };

    const handleDelete = async (user) => {
        const displayName = getUserDisplayName(user);
        if (!window.confirm(`Delete ${displayName} and all related portfolio data?`)) return;
        const toastId = notify.loading('Deleting user account...');
        setBusyId(user._id);
        setBusyAction('delete');
        try {
            await adminService.deleteUser(user._id);
            setUsers((current) => current.filter((item) => item._id !== user._id));
            notify.dismiss(toastId);
            notify.success(`${displayName}'s account has been deleted.`);
        } catch (err) {
            const message = err.message || 'Failed to delete account. Please try again.';
            setError(message);
            notify.dismiss(toastId);
            notify.error('Failed to delete account. Please try again.');
        } finally {
            setBusyId('');
            setBusyAction('');
        }
    };

    const handleViewPortfolio = async (user) => {
        setSelectedUser(user);
        setPortfolioOpen(true);
        setPortfolioLoading(true);
        setPortfolioError('');
        setPortfolioData(null);

        try {
            const response = await adminService.getPortfolioInspector(user._id);
            setPortfolioData(response.data || null);
        } catch (err) {
            const message = err.message || 'Failed to load portfolio data.';
            setPortfolioError(message);
            notify.error(message);
        } finally {
            setPortfolioLoading(false);
        }
    };

    const closePortfolioDrawer = () => {
        setPortfolioOpen(false);
        setPortfolioLoading(false);
        setPortfolioError('');
        setSelectedUser(null);
        setPortfolioData(null);
    };

    return (
        <div>
            <AdminPageHeader
                eyebrow="User operations"
                title="User Management"
                description="Search, review, suspend, reactivate, delete, or inspect investor accounts without leaving the admin tier."
                actions={<input className="admin-form-control" placeholder="Search by user or email" value={search} onChange={(event) => setSearch(event.target.value)} />}
            />

            <div
                style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 16,
                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                    paddingBottom: 4
                }}
            >
                {filterTabs.map((tab) => {
                    const isActive = statusFilter === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: isActive ? '#14b8a6' : '#94a3b8',
                                padding: '10px 14px',
                                marginBottom: -5,
                                borderBottom: isActive ? '3px solid #14b8a6' : '3px solid transparent',
                                fontWeight: isActive ? 700 : 600,
                                cursor: 'pointer'
                            }}
                        >
                            {`${tab.label} (${tab.count})`}
                        </button>
                    );
                })}
            </div>

            <AdminPanel title="Registered users" subtitle={`${filteredUsers.length} accounts shown`}>
                {error ? <p className="text-danger mb-3">{error}</p> : null}

                {loading ? (
                    <p className="admin-muted mb-0">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                    <AdminEmptyState title="No users found" description="Try a different search term or filter selection." />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Portfolio Value</th>
                                    <th>Transactions</th>
                                    <th>Join Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const displayName = getUserDisplayName(user);
                                    const avatarLetter = displayName.charAt(0).toUpperCase();
                                    const status = getUserStatus(user);
                                    const statusLabel = formatStatusLabel(status);
                                    const statusBadgeStyle = getStatusBadgeStyle(status);
                                    const isBusy = busyId === user._id;

                                    return (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-avatar">{avatarLetter}</div>
                                                    <div>
                                                        <strong>{displayName}</strong>
                                                        <div className="admin-muted">{user.role === 'admin' ? 'Administrator' : 'Investor'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{formatMoney(user.portfolioValue)}</td>
                                            <td>{user.transactionCount}</td>
                                            <td>{formatDate(user.createdAt)}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        borderRadius: 999,
                                                        padding: '3px 10px',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        letterSpacing: '0.01em',
                                                        textTransform: 'none',
                                                        ...statusBadgeStyle
                                                    }}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {status === 'active' || status === 'suspended' ? (
                                                        <button
                                                            type="button"
                                                            className={status === 'active' ? 'admin-warning-button' : 'admin-success-button'}
                                                            disabled={isBusy || user.role === 'admin'}
                                                            onClick={() => handleStatusToggle(user)}
                                                        >
                                                            {isBusy && busyAction === 'suspend' ? 'Suspending...' : null}
                                                            {isBusy && busyAction === 'reactivate' ? 'Reactivating...' : null}
                                                            {!isBusy ? (status === 'active' ? 'Suspend' : 'Reactivate') : null}
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        className="admin-secondary-button"
                                                        onClick={() => handleViewPortfolio(user)}
                                                    >
                                                        View Portfolio
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-danger-button"
                                                        disabled={isBusy || user.role === 'admin'}
                                                        onClick={() => handleDelete(user)}
                                                    >
                                                        {isBusy && busyAction === 'delete' ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminPanel>

            {portfolioOpen ? (
                <>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Close portfolio drawer"
                        onClick={closePortfolioDrawer}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                                closePortfolioDrawer();
                            }
                        }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.5)',
                            zIndex: 1020
                        }}
                    />

                    <aside
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            height: '100vh',
                            width: 'min(560px, 92vw)',
                            background: '#0f172a',
                            color: '#e5e7eb',
                            borderLeft: '1px solid rgba(148, 163, 184, 0.2)',
                            zIndex: 1021,
                            boxShadow: '-20px 0 50px rgba(2, 6, 23, 0.45)',
                            padding: 20,
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Portfolio Inspector</h3>
                                <p className="admin-muted" style={{ margin: '4px 0 0' }}>{selectedUser ? getUserDisplayName(selectedUser) : 'User'}</p>
                            </div>
                            <button type="button" className="admin-secondary-button" onClick={closePortfolioDrawer}>Close</button>
                        </div>

                        {portfolioLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
                                <div className="spinner-border spinner-border-sm text-info" role="status" aria-hidden="true" />
                                <span className="admin-muted">Loading portfolio data...</span>
                            </div>
                        ) : portfolioError ? (
                            <p className="text-danger mb-0">{portfolioError}</p>
                        ) : portfolioData ? (
                            <div style={{ display: 'grid', gap: 14 }}>
                                <AdminPanel title="Summary" subtitle="Aggregated across all portfolios">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                                        <div>
                                            <div className="admin-muted">Portfolios</div>
                                            <strong>{portfolioData.summary?.portfolios ?? 0}</strong>
                                        </div>
                                        <div>
                                            <div className="admin-muted">Holdings</div>
                                            <strong>{portfolioData.summary?.holdings ?? 0}</strong>
                                        </div>
                                        <div>
                                            <div className="admin-muted">Total Cost</div>
                                            <strong>{formatMoney(portfolioData.summary?.totalCost)}</strong>
                                        </div>
                                        <div>
                                            <div className="admin-muted">Current Value</div>
                                            <strong>{formatMoney(portfolioData.summary?.currentValue)}</strong>
                                        </div>
                                    </div>
                                </AdminPanel>

                                <AdminPanel title="Holdings" subtitle={`${portfolioData.holdings?.length || 0} symbols`}>
                                    {portfolioData.holdings && portfolioData.holdings.length > 0 ? (
                                        <div className="admin-table-wrap">
                                            <table className="admin-data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Symbol</th>
                                                        <th>Qty</th>
                                                        <th>Avg Price</th>
                                                        <th>Current Value</th>
                                                        <th>P&L</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {portfolioData.holdings.map((holding) => (
                                                        <tr key={holding.symbol}>
                                                            <td>{holding.symbol}</td>
                                                            <td>{holding.quantity}</td>
                                                            <td>{formatMoney(holding.averagePrice)}</td>
                                                            <td>{formatMoney(holding.currentValue)}</td>
                                                            <td style={{ color: (holding.gainLoss || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                                                                {formatMoney(holding.gainLoss)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <AdminEmptyState title="No holdings" description="This user currently has no holdings to inspect." />
                                    )}
                                </AdminPanel>
                            </div>
                        ) : (
                            <p className="admin-muted mb-0">No portfolio data available.</p>
                        )}
                    </aside>
                </>
            ) : null}
        </div>
    );
}

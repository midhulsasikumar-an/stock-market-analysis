import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    AdminStatusPill,
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

export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState('');

    useEffect(() => {
        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await adminService.getUsers({ search });
                console.log('[AdminUsers] getUsers full response:', response);
                setUsers(response.data || []);
                setError('');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [search]);

    const handleStatusToggle = async (user) => {
        const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
        setBusyId(user._id);
        try {
            await adminService.updateUserStatus(user._id, nextStatus);
            setUsers((current) => current.map((item) => item._id === user._id ? { ...item, accountStatus: nextStatus } : item));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    const handleDelete = async (user) => {
        const displayName = getUserDisplayName(user);
        if (!window.confirm(`Delete ${displayName} and all related portfolio data?`)) return;
        setBusyId(user._id);
        try {
            await adminService.deleteUser(user._id);
            setUsers((current) => current.filter((item) => item._id !== user._id));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    return (
        <div>
            <AdminPageHeader
                eyebrow="User operations"
                title="User Management"
                description="Search, review, suspend, reactivate, delete, or inspect investor accounts without leaving the admin tier."
                actions={<input className="admin-form-control" placeholder="Search by user or email" value={search} onChange={(event) => setSearch(event.target.value)} />}
            />

            <AdminPanel title="Registered users" subtitle={`${users.length} accounts loaded`}>
                {error ? <p className="text-danger mb-3">{error}</p> : null}

                {loading ? (
                    <p className="admin-muted mb-0">Loading users...</p>
                ) : users.length === 0 ? (
                    <AdminEmptyState title="No users found" description="Try a different search term or wait for new registrations." />
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
                                {users.map((user) => {
                                    const displayName = getUserDisplayName(user);
                                    const avatarLetter = displayName.charAt(0).toUpperCase();

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
                                        <td><AdminStatusPill value={user.accountStatus} /></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    className="admin-outline-button"
                                                    disabled={busyId === user._id || user.role === 'admin'}
                                                    onClick={() => handleStatusToggle(user)}
                                                >
                                                    {user.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-primary-button"
                                                    onClick={() => navigate(`/admin/portfolios?userId=${user._id}`)}
                                                >
                                                    View Portfolio
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-danger-button"
                                                    disabled={busyId === user._id || user.role === 'admin'}
                                                    onClick={() => handleDelete(user)}
                                                >
                                                    Delete
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
        </div>
    );
}
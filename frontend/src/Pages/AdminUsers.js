import React, { useEffect, useState } from 'react';
import authService from '../services/authService';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/users`, {
                headers: authService.getAuthHeaders()
            });
            const json = await response.json();
            if (json.success) setUsers(json.data);
            else setError(json.message);
        } catch (err) {
            setError("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [API_URL]);

    const toggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify({ accountStatus: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, accountStatus: newStatus } : u));
            } else {
                alert(data.message);
            }
        } catch (err) { }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to completely delete this user?")) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.filter(u => u._id !== userId));
            } else {
                alert(data.message);
            }
        } catch (err) { }
    };

    const changeRole = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to make this user an ${newRole}?`)) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
            } else {
                alert(data.message);
            }
        } catch (err) { }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
    if (error) return <div className="text-danger mt-5">{error}</div>;

    return (
        <div className="container-fluid py-4 min-vh-100" style={{ background: 'var(--bg-dark)' }}>
            <div className="mb-4 ps-2">
                <h2 className="fw-bold text-white mb-1">👥 User Management</h2>
                <p className="text-muted small">Manage all registered accounts</p>
            </div>

            <div className="bg-glass-card p-4 overflow-auto">
                <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
                    <thead>
                        <tr style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <th className="text-muted small fw-bold py-3">User</th>
                            <th className="text-muted small fw-bold py-3">Email</th>
                            <th className="text-muted small fw-bold py-3">Role</th>
                            <th className="text-muted small fw-bold py-3">Status</th>
                            <th className="text-muted small fw-bold py-3">Joined</th>
                            <th className="text-muted small fw-bold py-3 text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <td className="py-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                            <span className="text-primary fw-bold small">{user.username?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <span className="text-white fw-medium">{user.username}</span>
                                    </div>
                                </td>
                                <td className="text-muted py-3">{user.email}</td>
                                <td className="py-3">
                                    <select
                                        className="form-select form-select-sm bg-dark text-white border-secondary"
                                        value={user.role}
                                        onChange={(e) => changeRole(user._id, e.target.value)}
                                        style={{ width: '100px' }}
                                        disabled={user.email === 'tradetrackadmin@gmail.com'}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="py-3">
                                    <span className={`badge ${user.accountStatus === 'active' ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-10 border-0`}>
                                        {user.accountStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td className="text-muted py-3 small">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="py-3 text-end">
                                    {user.role !== 'admin' && (
                                        <div className="d-flex gap-2 justify-content-end">
                                            <button
                                                className={`btn btn-sm ${user.accountStatus === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                onClick={() => toggleStatus(user._id, user.accountStatus)}
                                            >
                                                {user.accountStatus === 'active' ? 'Suspend' : 'Unsuspend'}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteUser(user._id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                    {user.email === 'tradetrackadmin@gmail.com' && (
                                        <span className="text-muted small fst-italic">Master Admin</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && <div className="text-center py-5 text-muted">No users found</div>}
            </div>
        </div>
    );
}

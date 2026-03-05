import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AccountSettings() {
    const { user } = useAuth();
    const [joinDate, setJoinDate] = useState('N/A');

    useEffect(() => {
        if (user && user.createdAt) {
            setJoinDate(new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
    }, [user]);

    return (
        <div className="p-4 bg-glass rounded">
            <h2 className="text-xl fw-bold text-white mb-4">Account Information</h2>

            <div className="d-flex flex-column gap-3 mb-4 border rounded p-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {user?.role === 'admin' && (
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                        <div className="d-flex flex-column">
                            <span className="text-muted small">Admin ID</span>
                            <span className="text-white fw-bold">{user._id}</span>
                        </div>
                        <span className="badge bg-primary bg-opacity-10 text-primary">Full Access Level</span>
                    </div>
                )}

                <div className="d-flex justify-content-between">
                    <span className="text-muted small">Email Address</span>
                    <span className="text-white fw-bold">{user?.email || 'N/A'}</span>
                </div>

                <div className="d-flex justify-content-between">
                    <span className="text-muted small">Account Role</span>
                    <span className={`badge ${user?.role === 'admin' ? 'bg-primary text-primary' : 'bg-success text-success'} bg-opacity-10 rounded-pill px-3 py-2 text-capitalize`}>
                        {user?.role || 'User'}
                    </span>
                </div>

                <div className="d-flex justify-content-between border-top pt-2 mt-2 border-secondary border-opacity-25">
                    <span className="text-muted small">Date Joined</span>
                    <span className="text-white fw-bold">{joinDate}</span>
                </div>

                <div className="d-flex justify-content-between">
                    <span className="text-muted small">Account Status</span>
                    <span className="text-success fw-bold d-flex align-items-center gap-2">
                        <span className="bg-success rounded-circle" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                        {user?.accountStatus || 'Active'}
                    </span>
                </div>
            </div>

            <div className="p-3 bg-danger bg-opacity-10 rounded border border-danger border-opacity-25">
                <h5 className="text-danger fw-bold fs-6">Danger Zone</h5>
                <p className="text-muted small mb-3">Permanently delete your account. This action cannot be undone.</p>
                <button className="btn btn-outline-danger btn-sm" disabled>Request Deletion</button>
            </div>
        </div>
    );
}

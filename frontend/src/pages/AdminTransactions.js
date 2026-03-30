import React, { useEffect, useState } from 'react';
import authService from '../services/authService';

export default function AdminTransactions() {
    const [data, setData] = useState({ transactions: [], pagination: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const fetchTransactions = async (page = 1) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/transactions?page=${page}&limit=50`, {
                headers: authService.getAuthHeaders()
            });
            const json = await response.json();
            if (json.success) setData({ transactions: json.data, pagination: json.pagination });
            else setError(json.message);
        } catch (err) {
            setError("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [API_URL]);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
    if (error) return <div className="text-danger mt-5">{error}</div>;

    return (
        <div className="container-fluid py-4 min-vh-100" style={{ background: 'var(--bg-dark)' }}>
            <div className="mb-4 ps-2">
                <h2 className="fw-bold text-white mb-1">💸 System Transactions</h2>
                <p className="text-muted small">Monitor all global trades and investments</p>
            </div>

            <div className="bg-glass-card p-4 overflow-auto">
                <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
                    <thead>
                        <tr style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <th className="text-muted small fw-bold py-3">Date</th>
                            <th className="text-muted small fw-bold py-3">User</th>
                            <th className="text-muted small fw-bold py-3">Symbol</th>
                            <th className="text-muted small fw-bold py-3">Type</th>
                            <th className="text-muted small fw-bold py-3">Quantity</th>
                            <th className="text-muted small fw-bold py-3">Price</th>
                            <th className="text-muted small fw-bold py-3 text-end">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.transactions.length > 0 ? data.transactions.map(tx => (
                            <tr key={tx._id} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <td className="text-muted py-3 small">{new Date(tx.date).toLocaleString()}</td>
                                <td className="py-3">
                                    <span className="text-white fw-medium">{tx.userId?.username || "Unknown"}</span>
                                    <div className="text-muted small" style={{ fontSize: '0.7rem' }}>{tx.userId?.email}</div>
                                </td>
                                <td className="py-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="rounded-circle bg-primary-subtle p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                                            <span className="text-primary fw-bold" style={{ fontSize: '10px' }}>{tx.symbol?.charAt(0)}</span>
                                        </div>
                                        <span className="text-white fw-medium">{tx.symbol}</span>
                                    </div>
                                </td>
                                <td className="py-3">
                                    <span className={`badge ${tx.type === 'BUY' ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-10 border-0`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="text-white py-3">{tx.quantity}</td>
                                <td className="text-white py-3">${tx.price?.toFixed(2)}</td>
                                <td className="py-3 text-end text-white fw-bold">
                                    ${tx.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-5 text-muted">No transactions recorded</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            {data.pagination?.pages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <button
                        className="admin-secondary-button me-2"
                        disabled={data.pagination.page === 1}
                        onClick={() => fetchTransactions(data.pagination.page - 1)}
                    >
                        Previous
                    </button>
                    <span className="text-white align-self-center px-3">
                        Page {data.pagination.page} of {data.pagination.pages}
                    </span>
                    <button
                        className="admin-secondary-button ms-2"
                        disabled={data.pagination.page === data.pagination.pages}
                        onClick={() => fetchTransactions(data.pagination.page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

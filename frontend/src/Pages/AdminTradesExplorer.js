import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    AdminStatCard,
    AdminStatusPill,
    formatDateTime,
    formatMoney
} from '../components/admin/AdminUI';

export default function AdminTradesExplorer() {
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [summary, setSummary] = useState({ totalVolume: 0, buyCount: 0, sellCount: 0 });
    const [filters, setFilters] = useState({ userId: '', symbol: '', startDate: '', endDate: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminService.getUsers()
            .then((response) => setUsers(response.data || []))
            .catch(() => setUsers([]));
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadTransactions = async () => {
            setLoading(true);
            try {
                const response = await adminService.getTransactions({
                    ...filters,
                    page: pagination.page,
                    limit: 50
                });
                if (!cancelled) {
                    setTransactions(response.data || []);
                    setPagination(response.pagination || { page: 1, pages: 1 });
                    setSummary(response.summary || { totalVolume: 0, buyCount: 0, sellCount: 0 });
                    setError('');
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadTransactions();
        return () => {
            cancelled = true;
        };
    }, [filters, pagination.page]);

    const updateFilter = (key, value) => {
        setPagination((current) => ({ ...current, page: 1 }));
        setFilters((current) => ({ ...current, [key]: value }));
    };

    return (
        <div>
            <AdminPageHeader
                eyebrow="Trade surveillance"
                title="Trades Explorer"
                description="Inspect the full buy and sell ledger with admin-level filters by user, symbol, date, and trade direction."
            />

            <div className="admin-inline-stats" style={{ marginBottom: 16 }}>
                <AdminStatCard label="Filtered Volume" value={formatMoney(summary.totalVolume)} tone="success" />
                <AdminStatCard label="Buy Transactions" value={summary.buyCount} />
                <AdminStatCard label="Sell Transactions" value={summary.sellCount} tone="danger" />
            </div>

            <AdminPanel title="Trade history" subtitle="All platform trade events are available here.">
                <div className="admin-filter-grid">
                    <select className="admin-select" value={filters.userId} onChange={(event) => updateFilter('userId', event.target.value)}>
                        <option value="">All users</option>
                        {users.map((user) => <option key={user._id} value={user._id}>{user.username}</option>)}
                    </select>
                    <input className="admin-form-control" placeholder="Symbol" value={filters.symbol} onChange={(event) => updateFilter('symbol', event.target.value.toUpperCase())} />
                    <input type="date" className="admin-date-input" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} />
                    <input type="date" className="admin-date-input" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} />
                    <select className="admin-select" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
                        <option value="">BUY and SELL</option>
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                </div>

                {error ? <p className="text-danger mb-3">{error}</p> : null}

                {loading ? (
                    <p className="admin-muted mb-0">Loading trades...</p>
                ) : transactions.length === 0 ? (
                    <AdminEmptyState title="No trades match these filters" description="Broaden the date range or remove filters to inspect more activity." />
                ) : (
                    <>
                        <div className="admin-table-wrap">
                            <table className="admin-data-table">
                                <thead>
                                    <tr>
                                        <th>Executed</th>
                                        <th>User</th>
                                        <th>Symbol</th>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((trade) => (
                                        <tr key={trade._id}>
                                            <td>{formatDateTime(trade.executedAt || trade.createdAt)}</td>
                                            <td>
                                                <strong>{trade.userId?.username || 'Unknown'}</strong>
                                                <div className="admin-muted">{trade.userId?.email}</div>
                                            </td>
                                            <td><strong>{trade.symbol}</strong></td>
                                            <td><AdminStatusPill value={trade.type} tone={trade.type === 'BUY' ? 'success' : 'danger'} /></td>
                                            <td>{trade.quantity}</td>
                                            <td>{formatMoney(trade.pricePerUnit)}</td>
                                            <td>{formatMoney(trade.totalAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-panel-actions" style={{ justifyContent: 'space-between', marginTop: 16 }}>
                            <button type="button" className="admin-outline-button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
                            <span className="admin-muted">Page {pagination.page} of {pagination.pages}</span>
                            <button type="button" className="admin-outline-button" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
                        </div>
                    </>
                )}
            </AdminPanel>
        </div>
    );
}
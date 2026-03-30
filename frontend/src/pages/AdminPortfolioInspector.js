import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../services/adminService';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    AdminStatCard,
    formatMoney
} from '../components/admin/AdminUI';

export default function AdminPortfolioInspector() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(searchParams.get('userId') || '');
    const [portfolioData, setPortfolioData] = useState(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPortfolio, setLoadingPortfolio] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        adminService.getUsers()
            .then((response) => setUsers(response.data || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoadingUsers(false));
    }, []);

    useEffect(() => {
        if (!selectedUserId) {
            setPortfolioData(null);
            return;
        }

        const params = new URLSearchParams(searchParams);
        params.set('userId', selectedUserId);
        setSearchParams(params, { replace: true });

        setLoadingPortfolio(true);
        adminService.getPortfolioInspector(selectedUserId)
            .then((response) => {
                setPortfolioData(response.data);
                setError('');
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoadingPortfolio(false));
    }, [selectedUserId, searchParams, setSearchParams]);

    return (
        <div>
            <AdminPageHeader
                eyebrow="Investor holdings"
                title="Portfolio Inspector"
                description="Select a user to review aggregate holdings, average entry price, and current market value across their portfolios."
                actions={(
                    <select className="admin-select" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} disabled={loadingUsers}>
                        <option value="">Select a user</option>
                        {users.map((user) => <option key={user._id} value={user._id}>{user.username}</option>)}
                    </select>
                )}
            />

            {error ? <p className="text-danger mb-3">{error}</p> : null}

            {!selectedUserId ? (
                <AdminPanel>
                    <AdminEmptyState title="No user selected" description="Choose an account from the selector to load holdings." />
                </AdminPanel>
            ) : loadingPortfolio ? (
                <AdminPanel><p className="admin-muted mb-0">Loading portfolio holdings...</p></AdminPanel>
            ) : portfolioData ? (
                <>
                    <div className="admin-inline-stats" style={{ marginBottom: 16 }}>
                        <AdminStatCard label="Portfolios" value={portfolioData.summary.portfolios} />
                        <AdminStatCard label="Current Value" value={formatMoney(portfolioData.summary.currentValue)} tone="success" />
                        <AdminStatCard label="Net Gain/Loss" value={formatMoney(portfolioData.summary.totalGainLoss)} tone={portfolioData.summary.totalGainLoss >= 0 ? 'success' : 'danger'} />
                    </div>

                    <AdminPanel title={`${portfolioData.user.username}'s holdings`} subtitle={`${portfolioData.holdings.length} active holdings across ${portfolioData.summary.portfolios} portfolios`}>
                        {portfolioData.holdings.length === 0 ? (
                            <AdminEmptyState title="No holdings found" description="This user does not currently hold any active positions." />
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-data-table">
                                    <thead>
                                        <tr>
                                            <th>Stock</th>
                                            <th>Quantity</th>
                                            <th>Average Price</th>
                                            <th>Current Price</th>
                                            <th>Current Value</th>
                                            <th>Gain/Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolioData.holdings.map((holding) => (
                                            <tr key={holding.symbol}>
                                                <td>
                                                    <strong>{holding.symbol}</strong>
                                                    <div className="admin-muted">{holding.name}</div>
                                                </td>
                                                <td>{holding.quantity}</td>
                                                <td>{formatMoney(holding.averagePrice)}</td>
                                                <td>{formatMoney(holding.currentPrice)}</td>
                                                <td>{formatMoney(holding.currentValue)}</td>
                                                <td className={holding.gainLoss >= 0 ? 'text-success' : 'text-danger'}>{formatMoney(holding.gainLoss)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AdminPanel>
                </>
            ) : null}
        </div>
    );
}
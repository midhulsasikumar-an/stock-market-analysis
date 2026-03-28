import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import {
    AdminEmptyState,
    AdminPageHeader,
    AdminPanel,
    AdminStatusPill,
    formatDateTime
} from '../components/admin/AdminUI';

export default function AdminStocks() {
    const [stocks, setStocks] = useState([]);
    const [search, setSearch] = useState('');
    const [exchange, setExchange] = useState('US');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busySymbol, setBusySymbol] = useState('');

    useEffect(() => {
        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await adminService.getStocks({ search, exchange, limit: 100 });
                setStocks(response.data || []);
                setError('');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(timeout);
    }, [search, exchange]);

    const handleToggle = async (stock) => {
        setBusySymbol(stock.symbol);
        try {
            await adminService.updateStockVisibility(stock.symbol, {
                isEnabled: !stock.enabled,
                companyName: stock.companyName,
                market: stock.market,
                exchange: stock.exchange
            });
            setStocks((current) => current.map((item) => item.symbol === stock.symbol ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() } : item));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusySymbol('');
        }
    };

    return (
        <div>
            <AdminPageHeader
                eyebrow="Visibility control"
                title="Stock Management"
                description="Finnhub-backed symbols are read-only for pricing. Admin can only enable or disable visibility to user-facing screens."
                actions={(
                    <div className="admin-panel-actions" style={{ width: 'min(520px, 100%)' }}>
                        <input className="admin-form-control" placeholder="Search symbol, company, market" value={search} onChange={(event) => setSearch(event.target.value)} />
                        <select className="admin-select" value={exchange} onChange={(event) => setExchange(event.target.value)}>
                            <option value="US">US</option>
                            <option value="L">LSE</option>
                            <option value="TO">TSX</option>
                        </select>
                    </div>
                )}
            />

            <AdminPanel title="Visible symbols" subtitle="Only visibility can be changed. Market pricing remains API-controlled.">
                {error ? <p className="text-danger mb-3">{error}</p> : null}

                {loading ? (
                    <p className="admin-muted mb-0">Loading Finnhub symbols...</p>
                ) : stocks.length === 0 ? (
                    <AdminEmptyState title="No symbols found" description="Adjust the exchange or search query." />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-data-table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Company Name</th>
                                    <th>Market</th>
                                    <th>Enabled Status</th>
                                    <th>Last Updated</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stocks.map((stock) => (
                                    <tr key={stock.symbol}>
                                        <td><strong>{stock.symbol}</strong></td>
                                        <td>{stock.companyName}</td>
                                        <td>{stock.market}</td>
                                        <td><AdminStatusPill value={stock.enabled ? 'Enabled' : 'Disabled'} /></td>
                                        <td>{formatDateTime(stock.updatedAt)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className={stock.enabled ? 'admin-danger-button' : 'admin-primary-button'}
                                                disabled={busySymbol === stock.symbol}
                                                onClick={() => handleToggle(stock)}
                                            >
                                                {stock.enabled ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminPanel>
        </div>
    );
}
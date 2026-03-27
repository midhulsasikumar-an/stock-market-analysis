import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function Stock_Insights({ symbol }) {
    const [investmentAmount, setInvestmentAmount] = useState(() => {
        const saved = localStorage.getItem(`investment_${symbol}`);
        return saved ? JSON.parse(saved) : { quantity: 0, avgPrice: 0 };
    });

    const [isEditing, setIsEditing] = useState(false);
    const [tempQty, setTempQty] = useState(investmentAmount.quantity);
    const [tempPrice, setTempPrice] = useState(investmentAmount.avgPrice);

    useEffect(() => {
        localStorage.setItem(`investment_${symbol}`, JSON.stringify(investmentAmount));
    }, [investmentAmount, symbol]);

    // Simulated "Community" Data
    const communityData = {
        bought: 65,
        watching: 25,
        sold: 10
    };

    // Simulated Analyst Sentiment
    const analystData = {
        buy: 12,
        hold: 5,
        sell: 3
    };

    const pieData = {
        labels: ['Buy', 'Hold', 'Sell'],
        datasets: [
            {
                data: [analystData.buy, analystData.hold, analystData.sell],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.6)', // success
                    'rgba(148, 163, 184, 0.6)', // muted
                    'rgba(239, 68, 68, 0.6)',  // danger
                ],
                borderColor: [
                    '#10b981',
                    '#94a3b8',
                    '#ef4444',
                ],
                borderWidth: 1,
            },
        ],
    };

    const barData = {
        labels: ['Bought', 'Watching', 'Sold'],
        datasets: [
            {
                label: 'Community Sentiment (%)',
                data: [communityData.bought, communityData.watching, communityData.sold],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#94a3b8',
                    font: { size: 10 }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const handleSave = () => {
        setInvestmentAmount({ quantity: Number(tempQty), avgPrice: Number(tempPrice) });
        setIsEditing(false);
    };

    return (
        <div className="stock-insights mt-4">
            <h3 className="section-title mb-4">Market & User Insights</h3>

            <div className="row g-4">
                {/* Investment Tracker */}
                <div className="col-12">
                    <div className="bg-glass rounded-4 p-4 mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">My Investment</h5>
                            <button
                                className="btn btn-sm btn-glass px-3"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Cancel' : 'Update'}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="row g-3 align-items-end">
                                <div className="col-md-5">
                                    <label className="text-muted text-xs text-uppercase mb-1 d-block">Quantity</label>
                                    <input
                                        type="number"
                                        className="form-control bg-glass text-white border-0"
                                        value={tempQty}
                                        onChange={(e) => setTempQty(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-5">
                                    <label className="text-muted text-xs text-uppercase mb-1 d-block">Avg Purchase Price</label>
                                    <input
                                        type="number"
                                        className="form-control bg-glass text-white border-0"
                                        value={tempPrice}
                                        onChange={(e) => setTempPrice(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <button className="btn btn-accent w-100" onClick={handleSave}>Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="row g-3">
                                <div className="col-6 col-md-3">
                                    <span className="text-muted text-xs text-uppercase d-block">Shares Held</span>
                                    <span className="fw-bold h4 mb-0">{investmentAmount.quantity}</span>
                                </div>
                                <div className="col-6 col-md-3">
                                    <span className="text-muted text-xs text-uppercase d-block">Avg Price</span>
                                    <span className="fw-bold h4 mb-0">${investmentAmount.avgPrice.toFixed(2)}</span>
                                </div>
                                <div className="col-6 col-md-3">
                                    <span className="text-muted text-xs text-uppercase d-block">Investment</span>
                                    <span className="fw-bold h4 mb-0">${(investmentAmount.quantity * investmentAmount.avgPrice).toFixed(2)}</span>
                                </div>
                                <div className="col-6 col-md-3">
                                    <span className="text-muted text-xs text-uppercase d-block">Status</span>
                                    <span className={`badge ${investmentAmount.quantity > 0 ? 'bg-success' : 'bg-secondary'} rounded-pill mt-1`}>
                                        {investmentAmount.quantity > 0 ? 'INVESTED' : 'NOT TRACKED'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analyst Sentiment (Pie) */}
                <div className="col-md-6">
                    <div className="bg-glass rounded-4 p-4 h-100">
                        <h6 className="text-muted text-uppercase text-xs fw-bold mb-3 letter-spacing-wide">Analyst Consensus</h6>
                        <div style={{ height: '220px' }}>
                            <Pie data={pieData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'right', labels: { color: '#94a3b8' } } } }} />
                        </div>
                    </div>
                </div>

                {/* Community Ownership (Bar) */}
                <div className="col-md-6">
                    <div className="bg-glass rounded-4 p-4 h-100">
                        <h6 className="text-muted text-uppercase text-xs fw-bold mb-3 letter-spacing-wide">Community Pulse</h6>
                        <div style={{ height: '220px' }}>
                            <Bar data={barData} options={chartOptions} />
                        </div>
                        <p className="text-muted text-xs mt-3 text-center">
                            Based on {Math.floor(Math.random() * 5000 + 1000)} users tracking {symbol}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

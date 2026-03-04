import React from 'react'

export default function Stock_Header({ symbol, profile }) {
    const name = profile?.name || symbol || "Loading...";
    const industry = profile?.finnhubIndustry || "";
    const exchange = profile?.exchange || "";

    return (
        <div className="flex-between mb-lg">
            <div>
                <h1 className="text-xl font-bold">{name}</h1>
                <p className="text-muted text-sm">
                    {symbol} • {industry} • {exchange}
                </p>
            </div>

            <button className="btn-pill btn-accent">
                Add to Watchlist
            </button>
        </div>
    )
}

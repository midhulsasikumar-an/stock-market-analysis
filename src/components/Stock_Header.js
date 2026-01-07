import React from 'react'

export default function Stock_Header() {
    return (
        <div className="flex-between mb-lg">
            <div>
                <h1 className="text-xl font-bold">APPLE INC</h1>
                <p className="text-muted text-sm">
                    AAPL • Technology • NASDAQ
                </p>
            </div>

            <button className="btn-pill btn-accent">
                Add to Watchlist
            </button>
        </div>
    )
}

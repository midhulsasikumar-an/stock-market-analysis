import React from 'react'

export default function Trend_Row() {
    return (
        <div className="trend-box mt-md">
            <span className="trend-icon text-success">↑</span>

            <div>
                <p className="font-medium">Bullish Trend</p>
                <p className="text-muted text-sm">
                    Price trading above 50-day moving average
                </p>
            </div>
        </div>
    )
}

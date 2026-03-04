import React from 'react'

export default function Trend_Row({ quote }) {
    // Default to Loading or Neutral if no quote
    if (!quote) return null;

    const isBullish = quote.d >= 0;
    const trendText = isBullish ? "Bullish Trend" : "Bearish Trend";
    const trendIcon = isBullish ? "↑" : "↓";
    const trendColor = isBullish ? "text-success" : "text-danger";
    const trendDesc = isBullish
        ? "Price trading positive for the day"
        : "Price trading negative for the day";

    return (
        <div className="trend-box mt-md">
            <span className={`trend-icon ${trendColor}`}>{trendIcon}</span>

            <div>
                <p className="font-medium">{trendText}</p>
                <p className="text-muted text-sm">
                    {trendDesc}
                </p>
            </div>
        </div>
    )
}

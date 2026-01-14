import React from 'react'

export default function Price_Section({ quote }) {
    if (!quote) return null; // Or skeleton

    const price = quote.c;
    const change = quote.d;
    const percent = quote.dp;
    const isPositive = change >= 0;
    const colorClass = isPositive ? "text-success" : "text-danger";
    const arrow = isPositive ? "▲" : "▼";

    return (
        <div className="flex items-center gap-md mb-md">
            <span className="text-2xl font-semibold">{price} USD</span>
            <span className={`${colorClass} text-sm`}>
                {arrow} {change} ({percent}%)
            </span>
        </div>
    )
}

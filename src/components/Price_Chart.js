import React from 'react'

export default function Price_Chart() {
    return (
        <div className="mb-lg">
            <div className="bg-glass rounded-4 p-4 d-flex align-items-center justify-content-center text-muted border-glass" style={{ minHeight: '300px' }}>
                Chart Area
            </div>

            <div className="flex gap-sm mt-sm">
                <button className="btn-pill btn-glass active">1D</button>
                <button className="btn-pill btn-glass">1W</button>
                <button className="btn-pill btn-glass">1M</button>
                <button className="btn-pill btn-glass">1Y</button>
            </div>
        </div>
    )
}

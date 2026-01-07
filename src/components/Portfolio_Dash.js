import React from 'react'

export default function Portfolio_Dash() {
  return (
    <div>
      {/* Portfolio Snapshot Section */}
      <div className="container my-5 text-white">
        <h2 className="fw-bold mb-4">Your Portfolio Snapshot</h2>

        <div className="row g-4">

          {/* Total Invested */}
          <div className="col-md-3">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100 text-white">
              <h6 className="text-uppercase text-muted mb-1">Total Invested</h6>
              <h3 className="fw-bold">₹ 1,25,000</h3>
              <p className="text-light opacity-75 mb-1">Updated today</p>
            </div>
          </div>

          {/* Current Value */}
          <div className="col-md-3">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100 text-white">
              <h6 className="text-uppercase text-light opacity-75 mb-1">Current Value</h6>
              <h3 className="fw-bold">₹ 1,43,500</h3>
              <p className="small text-success">+₹ 18,500 profit</p>
            </div>
          </div>

          {/* Profit / Loss */}
          <div className="col-md-3">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100 text-white">
              <h6 className="text-uppercase text-muted mb-1">Profit / Loss</h6>
              <h3 className="fw-bold text-success">+14.8%</h3>
              <p className="small text-light opacity-75 mb-1">Based on total value</p>
            </div>
          </div>

          {/* Portfolio Mix */}
          <div className="col-md-3">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100 text-white">
              <h6 className="text-uppercase text-muted mb-1">Portfolio Mix</h6>
              <h5 className="fw-bold">Stocks • 100%</h5>
              <div className="progress mt-2" style={{ height: "6px" }}>
                <div className="progress-bar bg-success" style={{ width: "100%" }}></div>
              </div>
              <p className="text-light opacity-75 mb-1">Diversification coming soon</p>
            </div>
          </div>

        </div>
      </div>

    </div>

  )
}

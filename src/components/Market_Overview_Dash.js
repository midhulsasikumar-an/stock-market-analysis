import React from 'react'

export default function Market_Overview_Dash() {
  return (
    <div>
      <section className="container my-5 text-white">
        <h2 className="fw-bold mb-4">Market Overview 📊</h2>

        {/* Index Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card bg-glass rounded-4 p-3 hover-glow h-100">
              <h6 className="text-uppercase text-light opacity-75 mb-1">
                NIFTY 50
              </h6>
              <h3 className="text-light opacity-75 mb-1">22,145</h3>
              <span className="text-success fw-semibold">
                +0.85% ↑
              </span>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-glass rounded-4 p-3 hover-glow h-100">
              <h6 className="text-uppercase text-light opacity-75 mb-1">
                SENSEX
              </h6>
              <h3 className="text-light opacity-75 mb-1">73,520</h3>
              <span className="text-danger fw-semibold">
                -0.20% ↓
              </span>
            </div>
          </div>
        </div>

        {/* Market Sentiment */}
        <div className="card bg-glass rounded-4 p-3 hover-glow mb-4">
          <h6 className="text-uppercase text-light opacity-75 mb-2">
            Market Sentiment
          </h6>
          <h4 className="fw-bold text-success">
            Bullish 🟢
          </h4>
          <p className="small text-light opacity-75 mb-0">
            Broad market shows positive momentum today
          </p>
        </div>

        {/* Sector Performance */}
        <div className="card bg-glass rounded-4 p-3 hover-glow">
          <h6 className="text-uppercase text-light opacity-75 mb-3">
            Sector Performance
          </h6>

          <div className="d-flex flex-wrap gap-3">
            <span className="badge bg-success px-3 py-2">IT ↑</span>
            <span className="badge bg-danger px-3 py-2">Banking ↓</span>
            <span className="badge bg-success px-3 py-2">Pharma ↑</span>
            <span className="badge bg-danger px-3 py-2">Energy ↓</span>
            <span className="badge bg-success px-3 py-2">FMCG ↑</span>
          </div>
        </div>
      </section>
    </div>
  )
}

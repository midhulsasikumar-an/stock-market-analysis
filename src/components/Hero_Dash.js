import React from 'react'

export default function Hero_Dash() {
  return (
    <div className="text-white py-5 mt-5">
      <div className="container">

        {/* Centered heading */}
        <div className="text-center mb-5">
          <h1 className="fw-bold display-3">Welcome Back 👋</h1>
          <p className="text-secondary fs-4">
            Track your stocks, view insights, and analyse trends in real time.
          </p>
        </div>

        <div className="row">

          {/* LEFT – Big Cards */}
          <div className="col-md-8">
            <div className="row g-4">

              <div className="col-md-6">
                <div className="bg-glass rounded-4 p-4 text-center hover-glow h-100">
                  <h1 className="fw-bold display-4">12</h1>
                  <p className="text-muted fs-5">Tracked Stocks</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="bg-glass rounded-4 p-4 text-center hover-glow h-100">
                  <h1 className="fw-bold display-4">34</h1>
                  <p className="text-muted fs-5">Searches Today</p>
                </div>
              </div>

              <div className="col-12">
                <div className="bg-glass rounded-4 p-4 text-center hover-glow">
                  <h1 className="fw-bold display-4">4</h1>
                  <p className="text-muted fs-5">Watchlist Stocks</p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT – Extra Widget */}
          <div className="col-md-4">
            <div className="bg-glass rounded-4 p-4 text-center hover-glow h-100">
              <h4 className="fw-bold mb-3">📊 Market Summary</h4>

              <p className="text-success fw-bold fs-5">Sensex: +0.84%</p>
              <p className="text-success fw-bold fs-5">Nifty: +0.63%</p>
              <p className="text-info fw-bold fs-5">Volatility Index: Stable</p>

              <hr className="border-secondary my-3" />

              <p className="text-muted small">
                Updated just now • From global indexes
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>

  )
}

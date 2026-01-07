import React from 'react'

export default function Stock_Dash() {
  return (
    <div>
      <div className="container text-white mt-5 pt-4">

        {/* Section Title */}
        <h2 className="fw-bold mb-4">Top Stocks Today</h2>

        <div className="row g-4">

          {/* 🔥 Top Gainers */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100">
              <h5 className="fw-semibold mb-2">Top Gainers 🚀</h5>

              <div className="mt-3">
                <p className="mb-1 fw-bold">INFY</p>
                <p className="text-secondary mb-1">₹ 1,450</p>
                <p className="text-success fw-bold">+4.3%</p>

                {/* Dummy Sparkline */}
                <svg width="100%" height="40">
                  <polyline
                    points="0,30 20,20 40,25 60,10 80,15 100,5"
                    fill="none"
                    stroke="lime"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 📉 Top Losers */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100">
              <h5 className="fw-semibold mb-2">Top Losers 📉</h5>

              <div className="mt-3">
                <p className="mb-1 fw-bold">WIPRO</p>
                <p className="text-secondary mb-1">₹ 395</p>
                <p className="text-danger fw-bold">-2.8%</p>

                {/* Dummy Sparkline */}
                <svg width="100%" height="40">
                  <polyline
                    points="0,10 20,15 40,20 60,25 80,30 100,35"
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 🔥 Trending */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100">
              <h5 className="fw-semibold mb-2">Trending 🔥</h5>

              <div className="mt-3">
                <p className="mb-1 fw-bold">TCS</p>
                <p className="text-secondary mb-1">₹ 3,630</p>
                <p className="text-info fw-bold">+1.5%</p>

                {/* Dummy Sparkline */}
                <svg width="100%" height="40">
                  <polyline
                    points="0,20 20,25 40,15 60,18 80,12 100,20"
                    fill="none"
                    stroke="cyan"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ⭐ Most Searched */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-glass rounded-4 p-3 hover-glow h-100">
              <h5 className="fw-semibold mb-2">Most Searched ⭐</h5>

              <div className="mt-3">
                <p className="mb-1 fw-bold">RELIANCE</p>
                <p className="text-secondary mb-1">₹ 2,570</p>
                <p className="text-warning fw-bold">+0.9%</p>

                {/* Dummy Sparkline */}
                <svg width="100%" height="40">
                  <polyline
                    points="0,15 20,10 40,12 60,8 80,5 100,10"
                    fill="none"
                    stroke="yellow"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

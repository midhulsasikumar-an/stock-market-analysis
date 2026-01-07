import React from 'react'

export default function AboutUs() {
  return (
    <div>
      <section
        className="about-section py-5"
        style={{
          background: "linear-gradient(to bottom, #020617, #020617)",
          color: "white",
          paddingTop: "80px",
          paddingBottom: "80px",
        }}
      >
        <div className="container text-center ">
          <h2 className="mb-3 fw-bold" style={{ fontSize: "2.4rem" }}>
            About Us
          </h2>

          <p
            className="lead"
            style={{
              maxWidth: "750px",
              margin: "0 auto",
              opacity: 0.9,
              fontSize: "1.15rem",
            }}
          >
            TradeTrack empowers you to monitor live stock data, analyze market
            trends, and make confident investment decisions with clean analytics
            and a seamless interface.
          </p>

          <div className="row mt-5">

            {/* Card 1 */}
            <div className="col-md-4 mb-4">
              <div
                className="p-4 rounded"
                style={{
                  background: "rgba(30, 41, 59, 0.4)",
                  border: "1px solid #1f1f1f",
                  transition: "0.3s",
                }}
              >
                <h5 className="fw-semibold mb-2">Real-time Data</h5>
                <p style={{ opacity: 0.8 }}>
                  Stay ahead with instant and accurate stock market updates.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="col-md-4 mb-4">
              <div
                className="p-4 rounded"
                style={{
                  background: "rgba(30, 41, 59, 0.4)",
                  border: "1px solid #1f1f1f",
                  transition: "0.3s",
                }}
              >
                <h5 className="fw-semibold mb-2">Smart Analytics</h5>
                <p style={{ opacity: 0.8 }}>
                  Visual insights, charts, and trend analysis for better decisions.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="col-md-4 mb-4">
              <div
                className="p-4 rounded"
                style={{
                  background: "rgba(30, 41, 59, 0.4)",
                  border: "1px solid #1f1f1f",
                  transition: "0.3s",
                }}
              >
                <h5 className="fw-semibold mb-2">Easy To Use</h5>
                <p style={{ opacity: 0.8 }}>
                  Simple and clean design crafted for both beginners and experts.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}

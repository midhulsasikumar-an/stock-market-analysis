import React from 'react'

export default function Footer() {
  return (
    <div>
      <footer
        className="text-light pt-5 pb-3"
        style={{
          background: "#020617",
          borderTop: "1px solid #1c1c1c",
        }}
      >
        <div className="container">

          {/* Footer Top */}
          <div className="row text-center text-md-start mb-4">

            <div className="col-md-3 mb-4">
              <h5 className="fw-bold mb-3">TRADETRACK</h5>
              <p style={{ opacity: 0.7 }}>
                Real-time stock tracking and analytics for smart investors.
              </p>
            </div>

            <div className="col-md-3 mb-4">
              <h6 className="fw-semibold mb-3">PRODUCTS</h6>
              <ul className="list-unstyled" style={{ opacity: 0.8 }}>
                <li>Live Market</li>
                <li>Analytics</li>
                <li>Portfolio</li>
                <li>Dashboard</li>
              </ul>
            </div>

            <div className="col-md-3 mb-4">
              <h6 className="fw-semibold mb-3">USEFUL LINKS</h6>
              <ul className="list-unstyled" style={{ opacity: 0.8 }}>
                <li>About Us</li>
                <li>Pricing</li>
                <li>Help Center</li>
                <li>Documentation</li>
              </ul>
            </div>

            <div className="col-md-3 mb-4">
              <h6 className="fw-semibold mb-3">CONTACT</h6>
              <ul className="list-unstyled" style={{ opacity: 0.8 }}>
                <li>Email: support@tradetrack.com</li>
                <li>Phone: +91 98765 43210</li>
                <li>Location: India</li>
              </ul>
            </div>

          </div>

          {/* Divider */}
          <hr className="border-secondary" />

          {/* Footer Bottom */}
          <div className="text-center" style={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} TradeTrack. All Rights Reserved.
          </div>

        </div>
      </footer>

    </div>
  )
}

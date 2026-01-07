import React from 'react'

export default function Navbar() {
  return (
    <div><nav className="navbar navbar-expand-lg navbar-dark fixed-top bg-transparent">
      <div className="container-fluid">
        <a className="navbar-brand ms-3 fw-bold" href="#">TradeTrack</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            <li className="nav-item">
              <a className="nav-link" aria-current="page" href="#">Home</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Dashboard</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">About Us</a>
            </li>

          </ul>


          <div className="d-flex align-items-center">
            <button type="button" className="btn btn-outline-light mx-2" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
            <button className="btn btn-primary mx-2" data-bs-toggle="modal" data-bs-target="#registerModal">Register</button>
          </div>
        </div>
      </div>
    </nav></div>
  )
}


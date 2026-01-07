import React, { use } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar_Dash() {
  const navigate = useNavigate();
  const stockDetail = (e) => {
    e.preventDefault();
    navigate("/stock_search");
  }
  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{ background: "rgba(2, 6, 23, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#">TradeTrack</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {/* Left-aligned nav links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="#">Dashboard</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Stocks</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">About Us</a>
            </li>
          </ul>

          {/* Search bar */}
          <form className="d-flex me-3" role="search" onSubmit={stockDetail}>
            <input
              className="form-control me-2 bg-glass text-white border-glass rounded-pill"
              type="search"
              placeholder="Search Stocks..."
            />
            <button className="btn btn-glass rounded-pill px-3" type="submit">
              Search
            </button>
          </form>


          {/* Logout button */}
          <Link to="/">
            <button type="button" className="btn btn-outline-danger rounded-pill px-3">
              Logout
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

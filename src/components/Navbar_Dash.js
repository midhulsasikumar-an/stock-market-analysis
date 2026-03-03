import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ProfileAvatar from './Navbar/ProfileAvatar';
import NotificationBell from './Navbar/NotificationBell';

export default function Navbar_Dash() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const stockDetail = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/stock/${searchTerm.trim().toUpperCase()}`);
      setSearchTerm("");
    }
  };

  const isActive = (path) => {
    if (path === '/stocks') {
      return location.pathname.startsWith('/stocks');
    }
    return location.pathname === path;
  };

  return (
    <nav className="navbar-slim">
      <Link to="/dashboard" className="navbar-slim-brand">
        <img
          src="/tt-logo.png"
          alt="TradeTrack logo"
          style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
        />
        <span className="brand-text">TradeTrack</span>
      </Link>

      <div className="navbar-slim-divider"></div>

      <div className="navbar-slim-links">
        <Link
          to="/dashboard"
          className={`nav-slim-link ${isActive('/dashboard') ? 'active' : ''}`}
          title="Dashboard"
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Dashboard</span>
        </Link>
        <Link
          to="/stocks"
          className={`nav-slim-link ${isActive('/stocks') ? 'active' : ''}`}
          title="Stocks"
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Stocks</span>
        </Link>
        <Link
          to="/dashboard/news"
          className={`nav-slim-link ${isActive('/dashboard/news') ? 'active' : ''}`}
          title="News"
        >
          <span className="nav-icon">📰</span>
          <span className="nav-text">News</span>
        </Link>
        <Link
          to="/dashboard/portfolio"
          className={`nav-slim-link ${isActive('/dashboard/portfolio') ? 'active' : ''}`}
          title="Portfolio"
        >
          <span className="nav-icon">💼</span>
          <span className="nav-text">Portfolio</span>
        </Link>
      </div>

      <form className="navbar-slim-search" onSubmit={stockDetail}>
        <input
          type="text"
          placeholder="Search symbol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">🔍</button>
      </form>

      <div className="navbar-slim-actions">
        <NotificationBell />
        <ProfileAvatar />
      </div>
    </nav>
  );
}

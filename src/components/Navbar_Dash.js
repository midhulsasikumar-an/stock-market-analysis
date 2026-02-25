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

  // Check active route
  const isActive = (path) => {
    if (path === '/stocks') {
      return location.pathname.startsWith('/stocks');
    }
    return location.pathname === path;
  };

  return (
    <nav className="navbar-slim">
      {/* Logo */}
      <Link to="/dashboard" className="navbar-slim-brand">
        <span className="brand-icon">📈</span>
        <span className="brand-text">TradeTrack</span>
      </Link>

      {/* Divider */}
      <div className="navbar-slim-divider"></div>

      {/* Navigation Links */}
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
      </div>

      {/* Search */}
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

      {/* User Actions: Bell + Avatar */}
      <div className="navbar-slim-actions">
        <NotificationBell />
        <ProfileAvatar />
      </div>
    </nav>
  );
}

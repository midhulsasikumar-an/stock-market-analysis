import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ProfileAvatar from './Navbar/ProfileAvatar';
import NotificationBell from './Navbar/NotificationBell';
import { useAuth } from '../context/AuthContext';


export default function Navbar_Dash() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');

  const stockDetail = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/stock/${searchTerm.trim().toUpperCase()}`);
      setSearchTerm('');
    }
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/stocks' && location.pathname.startsWith('/stocks'));

  return (
    <nav className="dashboard-navbar">
      {/* Brand */}
      <Link to={user?.role === "admin" ? "/admin" : "/dashboard"} className="navbar-brand-dash">
        <img
          src="/tt-logo.png"
          alt="TradeTrack"
          className="brand-logo"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="brand-name">TradeTrack</span>
      </Link>

      {/* Navigation Links */}
      <div className="navbar-links-dash">
        {user?.role === "admin" ? (
          <>
            <Link to="/admin" className={`nav-pill-dash ${isActive('/admin') ? 'active' : ''}`}>
              🛡️ Admin Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={`nav-pill-dash ${isActive('/dashboard') ? 'active' : ''}`}>
              📊 Dashboard
            </Link>
            <Link to="/stocks" className={`nav-pill-dash ${isActive('/stocks') ? 'active' : ''}`}>
              📈 Markets
            </Link>
            <Link to="/dashboard/news" className={`nav-pill-dash ${isActive('/dashboard/news') ? 'active' : ''}`}>
              📰 News
            </Link>
            <Link to="/dashboard/portfolio" className={`nav-pill-dash ${isActive('/dashboard/portfolio') ? 'active' : ''}`}>
              💼 Portfolio
            </Link>
          </>
        )}
      </div>

      {/* Search + Actions */}
      <div className="navbar-actions-dash">
        <form className="nav-search-dash" onSubmit={stockDetail}>
          <i className="bi bi-search nav-search-icon"></i>
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        <NotificationBell />
        <ProfileAvatar />
      </div>
    </nav>
  );
}

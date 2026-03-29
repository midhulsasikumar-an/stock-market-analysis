import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ProfileAvatar from './Navbar/ProfileAvatar';
import NotificationBell from './Navbar/NotificationBell';
import { useAuth } from '../context/AuthContext';
import { fetchSearch, fetchSymbolVisibility, fetchQuote } from '../services/finnhub';

const POPULAR_SEARCHES = ['AAPL', 'AMZN', 'TSLA', 'GOOGL', 'MSFT'];


export default function Navbar_Dash() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const requestIdRef = useRef(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const trimmedTerm = searchTerm.trim();

  const selectedResult = useMemo(() => {
    if (activeIndex < 0 || activeIndex >= searchResults.length) return null;
    return searchResults[activeIndex];
  }, [activeIndex, searchResults]);

  const navigateToSymbol = useCallback(async (symbol) => {
    const cleanedSymbol = symbol.trim().toUpperCase();
    if (!cleanedSymbol) return;
    const visibility = await fetchSymbolVisibility([cleanedSymbol]);
    if (visibility[0] && !visibility[0].enabled) {
      window.alert('This stock is currently unavailable to user accounts.');
      return;
    }
    navigate(`/stock/${cleanedSymbol}`);
    setSearchTerm('');
    setSearchResults([]);
    setActiveIndex(-1);
    setIsOpen(false);
  }, [navigate]);

  const stockDetail = async (e) => {
    e.preventDefault();
    if (selectedResult) {
      await navigateToSymbol(selectedResult.symbol);
      return;
    }
    if (trimmedTerm) {
      await navigateToSymbol(trimmedTerm);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const query = trimmedTerm;

    if (!isOpen) return;

    if (!query) {
      setSearchResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const requestId = ++requestIdRef.current;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchSearch(query);
        const results = Array.isArray(data?.result) ? data.result.slice(0, 8) : [];

        const enriched = await Promise.all(results.map(async (item) => {
          try {
            const quote = await fetchQuote(item.symbol);
            return {
              ...item,
              price: quote?.c ?? null,
              changePercent: quote?.dp ?? null,
              change: quote?.d ?? null,
            };
          } catch {
            return {
              ...item,
              price: null,
              changePercent: null,
              change: null,
            };
          }
        }));

        if (requestId === requestIdRef.current) {
          setSearchResults(enriched);
          setActiveIndex(enriched.length > 0 ? 0 : -1);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedTerm, isOpen]);

  const handleKeyDown = async (event) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (loading) {
      if (event.key === 'Escape') setIsOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (searchResults.length === 0) return;
      setActiveIndex((current) => (current + 1) % searchResults.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (searchResults.length === 0) return;
      setActiveIndex((current) => (current <= 0 ? searchResults.length - 1 : current - 1));
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedResult) {
        await navigateToSymbol(selectedResult.symbol);
      } else if (trimmedTerm) {
        await navigateToSymbol(trimmedTerm);
      }
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    if (!value.trim()) {
      setSearchResults([]);
      setActiveIndex(-1);
    }
  };

  const handleChipClick = (symbol) => {
    setSearchTerm(symbol);
    setIsOpen(true);
    setActiveIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleResultClick = async (symbol) => {
    await navigateToSymbol(symbol);
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
          style={{ height: '32px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
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
        <div className="nav-search-shell" ref={searchWrapRef}>
          <form className="nav-search-dash" onSubmit={stockDetail}>
            <i className="bi bi-search nav-search-icon"></i>
            <input
              ref={searchInputRef}
              type="text"
              className="nav-search-input"
              placeholder="Search symbol or company..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            />
            <div className={`nav-search-spinner ${loading ? 'visible' : ''}`} aria-hidden="true">
              <span className="spinner-border spinner-border-sm" />
            </div>
          </form>

          {isOpen && !loading && (!trimmedTerm ? (
            <div className="nav-search-dropdown nav-search-dropdown--suggestions" role="listbox">
              <div className="nav-search-empty-title">Popular searches</div>
              <div className="nav-search-chips">
                {POPULAR_SEARCHES.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    className="nav-search-chip"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleChipClick(symbol)}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="nav-search-dropdown" role="listbox">
              {searchResults.map((result, index) => {
                const isActive = index === activeIndex;
                const priceUp = (result.changePercent ?? 0) >= 0;
                return (
                  <button
                    key={`${result.symbol}-${index}`}
                    type="button"
                    className={`nav-search-result ${isActive ? 'active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleResultClick(result.symbol)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className="nav-search-result-main">
                      <div className="nav-search-result-symbol">{result.symbol}</div>
                      <div className="nav-search-result-name">{result.description || result.displaySymbol || 'Unknown company'}</div>
                    </div>
                    <div className="nav-search-result-meta">
                      <div className={`nav-search-result-price ${priceUp ? 'up' : 'down'}`}>
                        {result.price != null ? `$${Number(result.price).toFixed(2)}` : '—'}
                      </div>
                      <div className={`nav-search-result-change ${priceUp ? 'up' : 'down'}`}>
                        {(result.changePercent ?? 0) >= 0 ? '+' : ''}{result.changePercent != null ? Number(result.changePercent).toFixed(2) : '0.00'}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : trimmedTerm ? (
            <div className="nav-search-dropdown nav-search-empty-state" role="status">
              <div className="nav-search-empty-title">No stocks found for '{trimmedTerm}'</div>
              <div className="nav-search-empty-subtitle">Try searching by company name (e.g. 'Apple') or ticker (e.g. 'AAPL')</div>
            </div>
          ) : null)}
        </div>
        <NotificationBell />
        <ProfileAvatar />
      </div>
    </nav>
  );
}

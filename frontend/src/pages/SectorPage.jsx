import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavbarDash from "../components/Navbar_Dash";
import StocksFooter from "../components/StocksFooter";
import { getSectorById } from "../data/stocksData";
import { fetchQuote, fetchSymbolVisibility } from "../services/finnhub";
import watchlistService from "../services/watchlistService";
import authService from "../services/authService";
import toast from 'react-hot-toast';
import "../styles/App.css";

const formatPercent = (value) => {
  if (value == null || isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatPrice = (value) => {
  if (value == null || isNaN(value) || value === 0) return "—";
  return `$${value.toFixed(2)}`;
};

const formatVolume = (value) => {
  if (!value) return "—";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
};


export default function SectorPage() {
  const { sector } = useParams();
  const navigate = useNavigate();
  const sectorData = getSectorById(sector);

  const [sortBy, setSortBy] = useState("price");
  const [sortDirection, setSortDirection] = useState("desc");
  const [message, setMessage] = useState("");
  const [liveQuotes, setLiveQuotes] = useState({});   // symbol → quote
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [enabledSymbols, setEnabledSymbols] = useState(null);

  useEffect(() => {
    if (!sectorData) return;
    fetchSymbolVisibility(sectorData.stocks.map((stock) => stock.symbol)).then((visibility) => {
      setEnabledSymbols(new Set(visibility.filter((item) => item.enabled).map((item) => item.symbol)));
    });
  }, [sectorData]);

  const visibleSectorStocks = useMemo(() => {
    if (!sectorData) return [];
    if (!enabledSymbols) return sectorData.stocks;
    return sectorData.stocks.filter((stock) => enabledSymbols.has(stock.symbol));
  }, [enabledSymbols, sectorData]);

  // ── Fetch live quotes for all stocks in this sector ──────────────────────
  const loadQuotes = useCallback(async () => {
    if (!sectorData) return;
    setLoadingQuotes(true);

    // Fetch all quotes in parallel (batched to avoid rate limit)
    const symbols = visibleSectorStocks.map(s => s.symbol);
    const BATCH = 6;  // 6 at a time

    const results = {};
    for (let i = 0; i < symbols.length; i += BATCH) {
      const batch = symbols.slice(i, i + BATCH);
      const settled = await Promise.allSettled(batch.map(sym => fetchQuote(sym)));
      settled.forEach((res, idx) => {
        if (res.status === "fulfilled" && res.value) {
          results[batch[idx]] = res.value;
        }
      });
      // Small pause between batches to stay under 60 req/min free limit
      if (i + BATCH < symbols.length) {
        await new Promise(r => setTimeout(r, 250));
      }
    }

    setLiveQuotes(results);
    setLoadingQuotes(false);
  }, [sectorData, visibleSectorStocks]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // ── Build enriched stock list ─────────────────────────────────────────────
  const enrichedStocks = useMemo(() => {
    if (!sectorData) return [];
    return visibleSectorStocks.map(stock => {
      const q = liveQuotes[stock.symbol];
      return {
        ...stock,
        price: q?.c ?? null,
        change: q?.dp ?? null,      // % change
        changeAbs: q?.d ?? null,    // absolute change
        volume: q?.v ?? null,
        open: q?.o ?? null,
        prevClose: q?.pc ?? null,
        high: q?.h ?? null,
        low: q?.l ?? null,
      };
    });
  }, [sectorData, liveQuotes, visibleSectorStocks]);

  const sortedStocks = useMemo(() => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return [...enrichedStocks].sort((a, b) => {
      const av = a[sortBy] ?? -Infinity;
      const bv = b[sortBy] ?? -Infinity;
      return (av - bv) * multiplier;
    });
  }, [enrichedStocks, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const sortIcon = (field) => {
    if (sortBy !== field) return <span style={{ opacity: 0.3 }}>⇅</span>;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const onAddToWatchlist = async (stock) => {
    if (!authService.isAuthenticated()) {
      setMessage("Please login to add symbols to your watchlist.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    const loadingId = toast.loading('Saving...');
    try {
      await watchlistService.addToWatchlist(stock.symbol, stock.companyName, "stock");
      setMessage(`✓ ${stock.symbol} added to watchlist`);
      setTimeout(() => setMessage(""), 3000);
      toast.success(`${stock.symbol} added to watchlist`, { id: loadingId });
    } catch (error) {
      if ((error.message || '').toLowerCase().includes('already')) {
        toast.error(`${stock.symbol} is already in your watchlist`, { id: loadingId });
      } else {
        toast.error('Something went wrong. Please try again.', { id: loadingId });
      }
      setMessage(error.message || "Failed to add to watchlist");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (!sectorData) {
    return (
      <div className="stocks-shell">
        <NavbarDash />
        <main className="stocks-main container-fluid">
          <h1 className="text-white mb-3">Sector Not Found</h1>
          <Link to="/stocks" className="back-link">← Back to Sectors</Link>
        </main>
        <StocksFooter />
      </div>
    );
  }

  // Sector-level stats computed from live data
  const validPrices = enrichedStocks.filter(s => s.change != null);
  const sectorPerf = validPrices.length
    ? validPrices.reduce((sum, s) => sum + s.change, 0) / validPrices.length
    : sectorData.performance;
  const trend = sectorPerf >= 0 ? "Bullish" : "Bearish";
  const gainers = validPrices.filter(s => s.change > 0).length;
  const losers = validPrices.filter(s => s.change < 0).length;

  return (
    <div className="stocks-shell">
      <NavbarDash />
      <main className="stocks-main container-fluid">
        {/* Breadcrumb */}
        <div className="page-row" style={{ marginBottom: "0.75rem" }}>
          <Link to="/stocks" className="back-link">← Back to Sectors</Link>
        </div>

        {/* Header */}
        <header className="stocks-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "2rem" }}>{sectorData.icon}</span>
            <div>
              <h1>{sectorData.name}</h1>
              <p style={{ margin: 0, opacity: 0.7, fontSize: "0.9rem" }}>{sectorData.description}</p>
            </div>
          </div>
          <button className="sector-refresh-btn" onClick={loadQuotes} disabled={loadingQuotes}>
            {loadingQuotes ? "⟳ Updating…" : "⟳ Refresh Quotes"}
          </button>
        </header>

        {/* Summary cards */}
        <section className="sector-summary-grid">
          <article className="summary-card">
            <span>Avg % Change</span>
            <strong className={sectorPerf >= 0 ? "text-up" : "text-down"}>
              {formatPercent(sectorPerf)}
            </strong>
          </article>
          <article className="summary-card">
            <span>Stocks Tracked</span>
            <strong>{sectorData.stocks.length}</strong>
          </article>
          <article className="summary-card">
            <span>Visible Stocks</span>
            <strong>{visibleSectorStocks.length}</strong>
          </article>
          <article className="summary-card">
            <span>Gainers / Losers</span>
            <strong>
              <span className="text-up">{gainers}▲</span>
              <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>/</span>
              <span className="text-down">{losers}▼</span>
            </strong>
          </article>
          <article className="summary-card">
            <span>Market Trend</span>
            <strong className={trend === "Bullish" ? "text-up" : "text-down"}>{trend}</strong>
          </article>
        </section>

        {/* Toast message */}
        {message && <p className="watchlist-message">{message}</p>}

        {/* Stocks Table */}
        <section className="stocks-table-wrap">
          {loadingQuotes && (
            <div className="quotes-loading-bar">
              <div className="quotes-loading-fill" />
            </div>
          )}
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>
                  <button type="button" onClick={() => handleSort("price")} className="sort-button">
                    Price {sortIcon("price")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("change")} className="sort-button">
                    Change % {sortIcon("change")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("changeAbs")} className="sort-button">
                    Change $ {sortIcon("changeAbs")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("volume")} className="sort-button">
                    Volume {sortIcon("volume")}
                  </button>
                </th>
                <th>Day Range</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock) => (
                <tr key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)} className="stock-row-clickable">
                  <td>
                    <span className="stock-symbol-badge">{stock.symbol}</span>
                  </td>
                  <td className="company-name-cell">{stock.companyName}</td>
                  <td className="price-cell">
                    {stock.price ? formatPrice(stock.price) : (
                      <span className="loading-dots">···</span>
                    )}
                  </td>
                  <td className={`change-cell ${stock.change > 0 ? "text-up" : stock.change < 0 ? "text-down" : ""}`}>
                    {stock.change != null ? formatPercent(stock.change) : "—"}
                  </td>
                  <td className={`change-cell ${stock.changeAbs > 0 ? "text-up" : stock.changeAbs < 0 ? "text-down" : ""}`}>
                    {stock.changeAbs != null
                      ? `${stock.changeAbs >= 0 ? "+" : ""}${stock.changeAbs.toFixed(2)}`
                      : "—"}
                  </td>
                  <td>{formatVolume(stock.volume)}</td>
                  <td className="range-cell-small">
                    {stock.low && stock.high ? (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <span className="text-down">{formatPrice(stock.low)}</span>
                        {" — "}
                        <span className="text-up">{formatPrice(stock.high)}</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="watchlist-btn"
                      onClick={() => onAddToWatchlist(stock)}
                    >
                      + Watchlist
                    </button>
                  </td>
                </tr>
              ))}
              {!loadingQuotes && sortedStocks.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">No visible stocks remain in this sector.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
      <StocksFooter />
    </div>
  );
}


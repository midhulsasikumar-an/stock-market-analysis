import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavbarDash from "../components/Navbar_Dash";
import StocksFooter from "../components/StocksFooter";
import { getSectorById } from "../data/stocksData";
import "./Stocks.css";

const formatPercent = (value) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatMarketCap = (value) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  return `$${(value / 1e6).toFixed(2)}M`;
};

const addToWatchlist = (stock) => {
  const saved = localStorage.getItem("watchlist");
  const parsed = saved ? JSON.parse(saved) : [];
  const exists = parsed.some((item) => item.symbol === stock.symbol);
  if (exists) return false;
  const next = [...parsed, { symbol: stock.symbol, name: stock.companyName, type: "stock" }];
  localStorage.setItem("watchlist", JSON.stringify(next));
  return true;
};

export default function SectorPage() {
  const { sector } = useParams();
  const navigate = useNavigate();
  const sectorData = getSectorById(sector);
  const [sortBy, setSortBy] = useState("price");
  const [sortDirection, setSortDirection] = useState("desc");
  const [message, setMessage] = useState("");

  const sortedStocks = useMemo(() => {
    if (!sectorData) return [];
    const multiplier = sortDirection === "asc" ? 1 : -1;
    const copy = [...sectorData.stocks];
    return copy.sort((a, b) => (a[sortBy] - b[sortBy]) * multiplier);
  }, [sectorData, sortBy, sortDirection]);

  const trend = sectorData && sectorData.performance >= 0 ? "Bullish" : "Bearish";

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortDirection("desc");
  };

  const onAddToWatchlist = (stock) => {
    const ok = addToWatchlist(stock);
    setMessage(ok ? `${stock.symbol} added to watchlist` : `${stock.symbol} already exists in watchlist`);
  };

  const openStockDetail = (symbol) => {
    navigate(`/stock/${symbol}`);
  };

  if (!sectorData) {
    return (
      <div className="stocks-shell">
        <NavbarDash />
        <main className="stocks-main container-fluid">
          <h1 className="text-white mb-3">Sector Not Found</h1>
          <Link to="/stocks" className="back-link">
            Back to Stocks
          </Link>
        </main>
        <StocksFooter />
      </div>
    );
  }

  return (
    <div className="stocks-shell">
      <NavbarDash />
      <main className="stocks-main container-fluid">
        <div className="page-row">
          <Link to="/stocks" className="back-link">
            Back to Sectors
          </Link>
        </div>

        <header className="stocks-page-header">
          <h1>{sectorData.name}</h1>
          <p>Sector summary and stock-level performance dashboard.</p>
        </header>

        <section className="sector-summary-grid">
          <article className="summary-card">
            <span>Overall Sector Performance</span>
            <strong className={sectorData.performance >= 0 ? "text-up" : "text-down"}>
              {formatPercent(sectorData.performance)}
            </strong>
          </article>
          <article className="summary-card">
            <span>Total Market Cap</span>
            <strong>{formatMarketCap(sectorData.totalMarketCap)}</strong>
          </article>
          <article className="summary-card">
            <span>Market Trend</span>
            <strong className={trend === "Bullish" ? "text-up" : "text-down"}>{trend}</strong>
          </article>
        </section>

        {message && <p className="watchlist-message">{message}</p>}

        <section className="stocks-table-wrap">
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company Name</th>
                <th>
                  <button type="button" onClick={() => handleSort("price")} className="sort-button">
                    Current Price
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("change")} className="sort-button">
                    Percentage Change
                  </button>
                </th>
                <th>Volume</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock) => (
                <tr key={stock.symbol}>
                  <td>
                    <button
                      type="button"
                      className="stock-link stock-link-button"
                      onClick={() => openStockDetail(stock.symbol)}
                    >
                      {stock.symbol}
                    </button>
                  </td>
                  <td>{stock.companyName}</td>
                  <td>${stock.price.toFixed(2)}</td>
                  <td className={stock.change >= 0 ? "text-up" : "text-down"}>{formatPercent(stock.change)}</td>
                  <td>{stock.volume.toLocaleString()}</td>
                  <td>
                    <button type="button" className="watchlist-btn" onClick={() => onAddToWatchlist(stock)}>
                      Add to Watchlist
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <StocksFooter />
    </div>
  );
}

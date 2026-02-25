import React from "react";
import { Link } from "react-router-dom";
import NavbarDash from "../components/Navbar_Dash";
import StocksFooter from "../components/StocksFooter";
import { STOCK_SECTORS } from "../data/stocksData";
import "./Stocks.css";

const formatPercent = (value) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

export default function StocksPage() {
  return (
    <div className="stocks-shell">
      <NavbarDash />
      <main className="stocks-main container-fluid">
        <header className="stocks-page-header">
          <h1>Sector Explorer</h1>
          <p>Explore stocks by market domain with live-style summary metrics.</p>
        </header>

        <section className="sector-card-grid">
          {STOCK_SECTORS.map((sector) => (
            <article key={sector.id} className="sector-card">
              <div className="sector-card-top">
                <h2>{sector.name}</h2>
                <span className={sector.performance >= 0 ? "pill-positive" : "pill-negative"}>
                  {formatPercent(sector.performance)}
                </span>
              </div>

              <div className="sector-metrics">
                <div>
                  <span className="metric-label">Stocks</span>
                  <strong>{sector.stocks.length}</strong>
                </div>
                <div>
                  <span className="metric-label">Sector Performance</span>
                  <strong className={sector.performance >= 0 ? "text-up" : "text-down"}>
                    {formatPercent(sector.performance)}
                  </strong>
                </div>
              </div>

              <Link className="view-sector-btn" to={`/stocks/${sector.id}`}>
                View Stocks
              </Link>
            </article>
          ))}
        </section>
      </main>
      <StocksFooter />
    </div>
  );
}

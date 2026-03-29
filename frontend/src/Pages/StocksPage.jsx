import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavbarDash from "../components/Navbar_Dash";
import { STOCK_SECTORS } from "../data/stocksData";
import { fetchSymbolVisibility } from "../services/finnhub";
import "./Stocks.css";

const formatPercent = (value) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatMarketCap = (value) => {
  if (!value) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  return `$${(value / 1e6).toFixed(1)}M`;
};

export default function StocksPage() {
  const [enabledSymbols, setEnabledSymbols] = useState(null);

  useEffect(() => {
    const allSymbols = STOCK_SECTORS.flatMap((sector) => sector.stocks.map((stock) => stock.symbol));
    fetchSymbolVisibility(allSymbols).then((visibility) => {
      const enabled = new Set(visibility.filter((item) => item.enabled).map((item) => item.symbol));
      setEnabledSymbols(enabled);
    });
  }, []);

  const visibleSectors = useMemo(() => {
    if (!enabledSymbols) return STOCK_SECTORS;
    return STOCK_SECTORS
      .map((sector) => ({
        ...sector,
        stocks: sector.stocks.filter((stock) => enabledSymbols.has(stock.symbol))
      }))
      .filter((sector) => sector.stocks.length > 0);
  }, [enabledSymbols]);

  const totalVisibleStocks = visibleSectors.reduce((count, sector) => count + sector.stocks.length, 0);

  return (
    <div className="stocks-shell">
      <NavbarDash />
      <main className="stocks-main container-fluid">
        <header className="stocks-page-header">
          <div>
            <h1>Market Sector Explorer</h1>
            <p>Browse {visibleSectors.length} sectors with {totalVisibleStocks}+ visible stocks. Click any sector for live quotes powered by Finnhub.</p>
          </div>
        </header>

        <section className="sector-card-grid">
          {visibleSectors.map((sector) => (
            <article key={sector.id} className="sector-card">
              <div className="sector-card-top">
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span className="sector-icon">{sector.icon}</span>
                  <h2>{sector.name}</h2>
                </div>
                <span className={sector.performance >= 0 ? "pill-positive" : "pill-negative"}>
                  {formatPercent(sector.performance)}
                </span>
              </div>

              <p className="sector-description">{sector.description}</p>

              <div className="sector-metrics">
                <div>
                  <span className="metric-label">Stocks</span>
                  <strong>{sector.stocks.length}</strong>
                </div>
                <div>
                  <span className="metric-label">Market Cap</span>
                  <strong>{formatMarketCap(sector.totalMarketCap)}</strong>
                </div>
                <div>
                  <span className="metric-label">Performance</span>
                  <strong className={sector.performance >= 0 ? "text-up" : "text-down"}>
                    {formatPercent(sector.performance)}
                  </strong>
                </div>
              </div>

              {/* Preview symbols */}
              <div className="sector-symbols-preview">
                {sector.stocks.slice(0, 5).map(s => (
                  <Link
                    key={s.symbol}
                    to={`/stock/${s.symbol}`}
                    className="symbol-chip"
                    onClick={e => e.stopPropagation()}
                  >
                    {s.symbol}
                  </Link>
                ))}
                {sector.stocks.length > 5 && (
                  <span className="symbol-chip-more">+{sector.stocks.length - 5} more</span>
                )}
              </div>

              <Link className="view-sector-btn" to={`/stocks/${sector.id}`}>
                View All {sector.stocks.length} Stocks →
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

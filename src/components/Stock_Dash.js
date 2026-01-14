import React, { useEffect, useState } from 'react';
import { fetchQuote, fetchCandles } from '../services/finnhub';
import { useNavigate } from 'react-router-dom';

const DASHBOARD_UI_CONFIG = [
  { id: 'gainers', title: "Top Gainers 🚀", stroke: "lime" },
  { id: 'losers', title: "Top Losers 📉", stroke: "red" },
  { id: 'trending', title: "Trending 🔥", stroke: "cyan" },
  { id: 'searched', title: "Most Searched ⭐", stroke: "yellow" }
];

const CANDIDATE_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META'];

export default function Stock_Dash() {
  const navigate = useNavigate();
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch quotes for all candidates
        const quotes = await Promise.all(
          CANDIDATE_SYMBOLS.map(async (sym) => {
            const q = await fetchQuote(sym);
            return {
              symbol: sym,
              price: q ? q.c : 0,
              percent: q ? q.dp : 0,
              absChange: q ? Math.abs(q.d) : 0,
              rawQuote: q
            };
          })
        );

        // Filter out failed fetches
        const validQuotes = quotes.filter(q => q.rawQuote !== null);

        if (validQuotes.length === 0) {
          setError("No stock data available. Check API limit or key.");
          setLoading(false);
          return;
        }

        // 2. Determine Categories
        // Sort by percent change desc
        const sortedByPercent = [...validQuotes].sort((a, b) => b.percent - a.percent);
        const topGainer = sortedByPercent[0];
        const topLoser = sortedByPercent[sortedByPercent.length - 1];

        // Trending: Max absolute price change
        // Exclude gainer/loser to avoid duplicates if possible, or just pick top abs change
        const sortedByAbsChange = [...validQuotes].sort((a, b) => b.absChange - a.absChange);
        const trending = sortedByAbsChange.find(q => q.symbol !== topGainer.symbol && q.symbol !== topLoser.symbol) || sortedByAbsChange[0];

        // Most Searched: Simulated (pick one of the popular remaining or random)
        const remaining = validQuotes.filter(q =>
          q.symbol !== topGainer.symbol &&
          q.symbol !== topLoser.symbol &&
          q.symbol !== trending.symbol
        );
        // Hardcode MSFT or TSLA if available as "Searched" or pick random
        const searched = remaining.length > 0 ? remaining[0] : validQuotes[0];

        const categoryMap = {
          gainers: topGainer,
          losers: topLoser,
          trending: trending,
          searched: searched
        };

        // 3. Prepare final data and fetch candles only for selected ones
        const finalData = {};

        for (const uiItem of DASHBOARD_UI_CONFIG) {
          const selected = categoryMap[uiItem.id];
          if (!selected) continue; // Should not happen if validQuotes > 0

          // Fetch specific candles
          const candles = await fetchCandles(selected.symbol, 'D');

          finalData[uiItem.id] = {
            symbol: selected.symbol,
            price: selected.price,
            percent: selected.percent,
            history: candles && candles.c ? candles.c : []
          };
        }

        setStockData(finalData);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper to generate polyline points from price history
  const getPoints = (prices) => {
    if (!prices || prices.length === 0) return "0,20 100,20";

    // We only take the last 10-20 points for a nice sparkline look if too many
    const recent = prices.slice(-7); // Last 7 days
    if (recent.length < 2) return "0,20 100,20";

    const min = Math.min(...recent);
    const max = Math.max(...recent);
    const range = max - min || 1;

    // SVG Viewbox is roughly 100 wide x 40 high
    // We populate points distributed along X
    const stepX = 100 / (recent.length - 1);

    return recent.map((p, i) => {
      const x = i * stepX;
      // Invert Y because SVG 0 is top. Scale to keep padding (5-35 range)
      const y = 40 - ((p - min) / range * 30 + 5);
      return `${x},${y}`;
    }).join(' ');
  };

  if (loading) {
    return (
      <div className="container text-white mt-5 pt-4">
        <h2 className="fw-bold mb-4">Top Stocks Today</h2>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Analyzing market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container text-white mt-5 pt-4">
        <h2 className="fw-bold mb-4">Top Stocks Today</h2>
        <div className="alert alert-danger bg-glass border-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <br />
          <small className="opacity-75">Please check your internet connection or API key.</small>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container text-white mt-5 pt-4">

        {/* Section Title */}
        <h2 className="fw-bold mb-4">Top Stocks Today</h2>

        <div className="row g-4">

          {DASHBOARD_UI_CONFIG.map((card) => {
            const data = stockData[card.id];

            // Fallback if individual data point missing but overall didn't fail
            if (!data) return null;

            const price = data.price.toFixed(2);
            const percent = data.percent.toFixed(2);
            const isPositive = data.percent >= 0;
            const colorClass = isPositive ? "text-success" : "text-danger";
            const sign = isPositive ? "+" : "";
            const displaySymbol = data.symbol;

            return (
              <div key={card.id} className="col-md-3 col-sm-6">
                <div
                  className="bg-glass rounded-4 p-3 hover-glow h-100 cursor-pointer"
                  onClick={() => navigate(`/stock/${displaySymbol}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5 className="fw-semibold mb-2">{card.title}</h5>

                  <div className="mt-3">
                    <p className="mb-1 fw-bold">{displaySymbol}</p>
                    <p className="text-secondary mb-1">₹ {price} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(USD)</span></p>
                    <p className={`${colorClass} fw-bold`}>{sign}{percent}%</p>

                    {/* Sparkline */}
                    <div style={{ height: '40px' }} className="d-flex align-items-center justify-content-center">
                      {data.history && data.history.length > 2 ? (
                        <svg width="100%" height="40" className="fadeIn">
                          <polyline
                            points={getPoints(data.history)}
                            fill="none"
                            stroke={card.stroke}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <div className="w-100 border-top border-secondary border-opacity-25 opacity-25" style={{ height: '1px' }}></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react';
import { fetchQuote, fetchCandles } from '../services/finnhub';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardRedesign.css';

const DASHBOARD_UI_CONFIG = [
  { id: 'gainers', title: "Top Stocks Today", emoji: "📈", stroke: "#2ef08a" },
  { id: 'losers', title: "Top Losers", emoji: "📉", stroke: "#ff3e3e" },
  { id: 'trending', title: "Trending", emoji: "🚩", stroke: "#f59e0b" },
  { id: 'searched', title: "Most Searched", emoji: "⭐", stroke: "#3b82f6" }
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

        const validQuotes = quotes.filter(q => q.rawQuote !== null);
        if (validQuotes.length === 0) {
          setError("No stock data available.");
          setLoading(false);
          return;
        }

        const sortedByPercent = [...validQuotes].sort((a, b) => b.percent - a.percent);
        const topGainer = sortedByPercent[0];
        const topLoser = sortedByPercent[sortedByPercent.length - 1];
        const sortedByAbsChange = [...validQuotes].sort((a, b) => b.absChange - a.absChange);
        const trending = sortedByAbsChange.find(q => q.symbol !== topGainer.symbol && q.symbol !== topLoser.symbol) || sortedByAbsChange[0];
        const remaining = validQuotes.filter(q => q.symbol !== topGainer.symbol && q.symbol !== topLoser.symbol && q.symbol !== trending.symbol);
        const searched = remaining.length > 0 ? remaining[0] : validQuotes[0];

        const categoryMap = { gainers: topGainer, losers: topLoser, trending: trending, searched: searched };
        const finalData = {};

        for (const uiItem of DASHBOARD_UI_CONFIG) {
          const selected = categoryMap[uiItem.id];
          if (!selected) continue;
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
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getPoints = (prices) => {
    if (!prices || prices.length < 2) return "0,20 100,20";
    const recent = prices.slice(-10);
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    const range = max - min || 1;
    const stepX = 100 / (recent.length - 1);
    return recent.map((p, i) => `${i * stepX},${40 - ((p - min) / range * 30 + 5)}`).join(' ');
  };

  if (loading) return <div className="p-5 text-center text-muted">Loading analytics...</div>;
  if (error) return <div className="p-5 text-center text-danger">{error}</div>;

  return (
    <div className="bottom-grid-redesign">
      {DASHBOARD_UI_CONFIG.map((card) => {
        const data = stockData[card.id];
        if (!data) return null;

        const isPositive = data.percent >= 0;
        const color = isPositive ? "var(--dash-accent-green)" : "var(--dash-accent-red)";

        return (
          <div
            key={card.id}
            className="bottom-card-redesign"
            style={{ borderTop: `3px solid ${card.stroke}` }}
            onClick={() => navigate(`/stock/${data.symbol}`)}
          >
            <div className="bottom-card-title">
              {card.title} {card.emoji}
            </div>
            <div className="bottom-card-symbol">{data.symbol}</div>
            <div className="bottom-card-price">+ {data.price.toFixed(2)} (1.33%)</div>
            <div className="bottom-card-change" style={{ color }}>
              {isPositive ? '+' : ''}{data.percent.toFixed(2)}%
            </div>
            {/* Sparkline */}
            <div style={{ height: '45px', marginTop: '10px' }}>
              <svg width="100%" height="45" viewBox="0 0 100 45" preserveAspectRatio="none">
                <polyline
                  points={getPoints(data.history)}
                  fill="none"
                  stroke={card.stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

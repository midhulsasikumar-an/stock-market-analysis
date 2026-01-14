import React, { useEffect, useState, useCallback } from 'react';
import { fetchQuote, fetchMarketNews, fetchCandles } from '../services/finnhub';

// Default watchlist symbols
const DEFAULT_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
];

// Helper to generate sparkline points
const getSparklinePoints = (prices) => {
  if (!prices || prices.length < 2) return "";
  const recent = prices.slice(-7);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;
  const stepX = 60 / (recent.length - 1); // 60px wide sparkline

  return recent.map((p, i) => {
    const x = i * stepX;
    const y = 20 - ((p - min) / range * 14 + 3); // 20px high, 3px padding
    return `${x},${y}`;
  }).join(' ');
};

// WatchlistRow Component
const WatchlistRow = ({ item, isSelected, onClick, onRemove }) => {
  const isPositive = item.change >= 0;
  const changeColor = item.change === 0 ? 'text-muted' : isPositive ? 'text-success' : 'text-danger';
  const sign = isPositive && item.change !== 0 ? '+' : '';

  return (
    <div
      className={`watchlist-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(item)}
    >
      {/* Left: Badge */}
      <div className="watchlist-badge">
        <span className="symbol-icon">{item.symbol.slice(0, 2)}</span>
      </div>

      {/* Center: Symbol & Sparkline */}
      <div className="watchlist-info">
        <span className="watchlist-symbol">{item.symbol}</span>
        {/* Mini Sparkline */}
        <div className="watchlist-sparkline mt-1" style={{ height: '20px', width: '60px' }}>
          {item.history && item.history.length > 2 ? (
            <svg width="60" height="20">
              <polyline
                points={getSparklinePoints(item.history)}
                fill="none"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div className="w-100 border-top border-secondary opacity-10" style={{ marginTop: '10px' }}></div>
          )}
        </div>
      </div>

      {/* Right: Price & Change */}
      <div className="watchlist-data">
        <span className="watchlist-price">
          {item.price !== null ? `$${item.price.toFixed(2)}` : '---'}
        </span>
        <span className={`watchlist-change ${changeColor}`}>
          {item.changePercent !== null ? `${sign}${item.changePercent.toFixed(2)}%` : '---'}
        </span>
      </div>

      {/* Remove Button (visible on hover) */}
      <button
        className="watchlist-remove"
        onClick={(e) => { e.stopPropagation(); onRemove(item.symbol); }}
        title="Remove from watchlist"
      >
        ×
      </button>
    </div>
  );
};

// DetailPanel Component
const DetailPanel = ({ item, news }) => {
  if (!item) return null;

  const isPositive = item.change >= 0;
  const changeColor = item.change === 0 ? 'text-muted' : isPositive ? 'text-success' : 'text-danger';
  const sign = isPositive && item.change !== 0 ? '+' : '';

  // Simulated market status (in real app, derive from quote data)
  const isMarketOpen = new Date().getHours() >= 9 && new Date().getHours() < 16;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3 className="detail-symbol">{item.symbol}</h3>
        <span className="detail-exchange">{item.name} · NYSE</span>
      </div>

      <div className="detail-price-section">
        <span className="detail-price">
          {item.price !== null ? `$${item.price.toFixed(2)}` : '---'}
        </span>
        <span className={`detail-change ${changeColor}`}>
          {item.change !== null && (
            <>
              {sign}{item.change.toFixed(2)} ({sign}{item.changePercent?.toFixed(2)}%)
            </>
          )}
        </span>
      </div>

      <div className="detail-status">
        <span className={`status-badge ${isMarketOpen ? 'open' : 'closed'}`}>
          {isMarketOpen ? '● Market Open' : '○ Market Closed'}
        </span>
      </div>

      {/* Related News */}
      {news && news.length > 0 && (
        <div className="detail-news">
          <h6 className="detail-news-title">Latest News</h6>
          <a href={news[0].url} target="_blank" rel="noopener noreferrer" className="detail-news-link">
            {news[0].headline}
          </a>
        </div>
      )}
    </div>
  );
};

// Main Watchlist Component
export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : DEFAULT_SYMBOLS;
  });
  const [quotes, setQuotes] = useState({});
  const [history, setHistory] = useState({});
  const [selected, setSelected] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState('');

  // Fetch quotes and history for all watchlist items
  const loadQuotes = useCallback(async () => {
    setLoading(true);
    const results = {};
    const historyResults = {};

    try {
      await Promise.all(watchlist.map(async (item) => {
        const [quote, history] = await Promise.all([
          fetchQuote(item.symbol),
          fetchCandles(item.symbol, 'D', 7) // 7 days for sparkline
        ]);

        if (quote) {
          results[item.symbol] = {
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
          };
        }

        if (history && history.s === 'ok' && history.c) {
          historyResults[item.symbol] = history.c;
        } else {
          console.log(`[Watchlist:${item.symbol}] No sparkline data: ${history?.s || 'unknown'}`);
        }
      }));

      setQuotes(results);
      // We need to store history too
      setHistory(historyResults);
    } catch (err) {
      console.error("[Watchlist] Failed to refresh data:", err);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    loadQuotes();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadQuotes, 60000);
    return () => clearInterval(interval);
  }, [loadQuotes]);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Fetch news when selection changes
  useEffect(() => {
    if (selected) {
      fetchMarketNews('general').then(data => {
        // Filter news related to selected symbol (simple filter)
        const relatedNews = data.filter(n =>
          n.related?.includes(selected.symbol) ||
          n.headline?.includes(selected.symbol)
        ).slice(0, 3);
        setNews(relatedNews.length > 0 ? relatedNews : data.slice(0, 1));
      });
    }
  }, [selected]);

  // Merge watchlist with quotes and history
  const enrichedList = watchlist.map(item => ({
    ...item,
    price: quotes[item.symbol]?.price ?? null,
    change: quotes[item.symbol]?.change ?? null,
    changePercent: quotes[item.symbol]?.changePercent ?? null,
    history: history[item.symbol] ?? null,
  }));

  // Add symbol handler
  const handleAddSymbol = (e) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !watchlist.find(w => w.symbol === symbol)) {
      setWatchlist([...watchlist, { symbol, name: symbol, type: 'stock' }]);
      setNewSymbol('');
    }
  };

  // Remove symbol handler
  const handleRemove = (symbol) => {
    setWatchlist(watchlist.filter(w => w.symbol !== symbol));
    if (selected?.symbol === symbol) setSelected(null);
  };

  return (
    <section className="watchlist-wrapper">
      <div className="watchlist-container">
        {/* Header */}
        <div className="watchlist-header">
          <h2 className="watchlist-title">
            <span className="title-icon">👀</span> Watchlist
          </h2>
          <span className="watchlist-count">{watchlist.length} symbols</span>
        </div>

        {/* Add Symbol Form */}
        <form className="watchlist-add-form" onSubmit={handleAddSymbol}>
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add symbol (e.g., AAPL)"
            className="watchlist-input"
          />
          <button type="submit" className="watchlist-add-btn">+</button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="watchlist-loading">
            <div className="spinner-border spinner-border-sm text-primary"></div>
          </div>
        )}

        {/* List Container */}
        <div className="watchlist-list">
          {enrichedList.map((item) => (
            <WatchlistRow
              key={item.symbol}
              item={item}
              isSelected={selected?.symbol === item.symbol}
              onClick={setSelected}
              onRemove={handleRemove}
            />
          ))}

          {watchlist.length === 0 && !loading && (
            <div className="watchlist-empty">
              <p className="text-muted">No symbols in watchlist.</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <DetailPanel item={selected} news={news} />
        )}
      </div>
    </section>
  );
}

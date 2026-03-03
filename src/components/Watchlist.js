import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchQuote, fetchMarketNews, fetchCandles } from '../services/finnhub';
import watchlistService from '../services/watchlistService';

// Default watchlist symbols (fallbacks for new users)
const DEFAULT_SYMBOLS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'stock' },
  { symbol: 'TCS', name: 'TCS', type: 'stock' },
  { symbol: 'INFY', name: 'Infosys', type: 'stock' },
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
      <div className="watchlist-badge">
        <span className="symbol-icon">{item.symbol.slice(0, 2)}</span>
      </div>

      <div className="watchlist-info">
        <span className="watchlist-symbol">{item.symbol}</span>
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

      <div className="watchlist-data">
        <span className="watchlist-price">
          {item.price !== null ? `₹${item.price.toFixed(2)}` : '---'}
        </span>
        <span className={`watchlist-change ${changeColor}`}>
          {item.changePercent !== null ? `${sign}${item.changePercent.toFixed(2)}%` : '---'}
        </span>
      </div>

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

  const isMarketOpen = new Date().getHours() >= 9 && new Date().getHours() < 16;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3 className="detail-symbol">{item.symbol}</h3>
        <span className="detail-exchange">{item.name} · NSE</span>
      </div>

      <div className="detail-price-section">
        <span className="detail-price">
          {item.price !== null ? `₹${item.price.toFixed(2)}` : '---'}
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

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [history, setHistory] = useState({});
  const [selected, setSelected] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState(null);

  const initialLoadDone = useRef(false);

  // 1. Fetch persistent watchlist from DB
  const fetchWatchlistFromDB = useCallback(async () => {
    try {
      setLoading(true);
      const data = await watchlistService.getWatchlist();
      setWatchlist(data.length > 0 ? data : DEFAULT_SYMBOLS);
      initialLoadDone.current = true;
    } catch (err) {
      console.error("DB Watchlist Error:", err);
      setError("Failed to sync watchlist with server.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Refresh market data (quotes/sparklines)
  const refreshMarketData = useCallback(async () => {
    if (watchlist.length === 0) return;

    const results = {};
    const historyResults = {};

    try {
      await Promise.all(watchlist.map(async (item) => {
        const [quote, hist] = await Promise.all([
          fetchQuote(item.symbol),
          fetchCandles(item.symbol, 'D', 7)
        ]);

        if (quote) {
          results[item.symbol] = {
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
          };
        }

        if (hist && hist.s === 'ok' && hist.c) {
          historyResults[item.symbol] = hist.c;
        }
      }));

      setQuotes(results);
      setHistory(historyResults);
    } catch (err) {
      console.warn("Market data refresh warning:", err.message);
    }
  }, [watchlist]);

  // Handle initialization
  useEffect(() => {
    fetchWatchlistFromDB();
  }, [fetchWatchlistFromDB]);

  // Handle data refresh
  useEffect(() => {
    if (initialLoadDone.current) {
      refreshMarketData();
      const interval = setInterval(refreshMarketData, 60000);
      return () => clearInterval(interval);
    }
  }, [refreshMarketData]);

  useEffect(() => {
    if (selected) {
      fetchMarketNews('general').then(data => {
        const relatedNews = data.filter(n =>
          n.related?.includes(selected.symbol) ||
          n.headline?.includes(selected.symbol)
        ).slice(0, 3);
        setNews(relatedNews.length > 0 ? relatedNews : data.slice(0, 1));
      });
    }
  }, [selected]);

  const handleAddSymbol = async (e) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;

    if (watchlist.find(w => w.symbol === symbol)) {
      setNewSymbol('');
      return;
    }

    try {
      setLoading(true);
      const newItem = await watchlistService.addToWatchlist(symbol);
      setWatchlist(prev => [newItem, ...prev]);
      setNewSymbol('');
    } catch (err) {
      setError(err.message || "Failed to add symbol.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (symbol) => {
    try {
      await watchlistService.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
      if (selected?.symbol === symbol) setSelected(null);
    } catch (err) {
      console.error("Remove Error:", err);
      setError("Failed to remove item.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const enrichedList = watchlist.map(item => ({
    ...item,
    price: quotes[item.symbol]?.price ?? null,
    change: quotes[item.symbol]?.change ?? null,
    changePercent: quotes[item.symbol]?.changePercent ?? null,
    history: history[item.symbol] ?? null,
  }));

  return (
    <section className="watchlist-wrapper">
      <div className="watchlist-container">
        <div className="watchlist-header">
          <h2 className="watchlist-title">
            <span className="title-icon">📊</span> Market Watch
          </h2>
          <span className="watchlist-count">{watchlist.length} items</span>
        </div>

        {error && <div className="alert alert-danger py-1 px-2 mx-3 mb-2 small bg-glass border-0">{error}</div>}

        <form className="watchlist-add-form" onSubmit={handleAddSymbol}>
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add NSE Symbol (e.g. INF_Y)"
            className="watchlist-input"
          />
          <button type="submit" className="watchlist-add-btn" disabled={loading}>+</button>
        </form>

        {loading && watchlist.length === 0 && (
          <div className="watchlist-loading py-4">
            <div className="spinner-border spinner-border-sm text-primary"></div>
          </div>
        )}

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

        {selected && (
          <DetailPanel item={selected} news={news} />
        )}
      </div>
    </section>
  );
}

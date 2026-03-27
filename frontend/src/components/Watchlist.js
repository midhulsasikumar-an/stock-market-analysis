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
  const isPositive = (item.changePercent || 0) >= 0;
  return (
    <div
      className={`watchlist-item-redesign ${isSelected ? 'active' : ''}`}
      onClick={() => onClick(item)}
    >
      <div className="d-flex align-items-center gap-3">
        <div className="symbol-badge-redesign" title={item.symbol}>
          {item.symbol.length > 4 ? item.symbol.slice(0, 4) : item.symbol}
        </div>
        <div className="flex-grow-1">
          <div className="symbol-name-redesign">{item.symbol}</div>
          <div className="sparkline-mini-redesign">
            {item.history && item.history.length > 2 ? (
              <svg width="60" height="15">
                <polyline
                  points={getSparklinePoints(item.history)}
                  fill="none"
                  stroke={isPositive ? 'var(--dash-accent-green)' : 'var(--dash-accent-red)'}
                  strokeWidth="1.5"
                />
              </svg>
            ) : <span className="opacity-25">---</span>}
          </div>
        </div>
        <div className="text-end me-2">
          <div className="price-label-redesign">₹{item.price ? item.price.toFixed(2) : '---'}</div>
          <div className={`change-label-redesign ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? '+' : ''}{item.changePercent ? item.changePercent.toFixed(2) : '0.00'}%
          </div>
        </div>
        <button
          className="remove-btn-redesign"
          onClick={(e) => { e.stopPropagation(); onRemove(item.symbol); }}
        >×</button>
      </div>
    </div>
  );
};

const DetailPanel = ({ item, news, onClose }) => {
  if (!item) return null;
  const isPositive = (item.changePercent || 0) >= 0;
  const isMarketOpen = new Date().getHours() >= 9 && new Date().getHours() < 16;

  return (
    <div className="watch-detail-redesign mt-3 pt-3 border-top border-secondary border-opacity-10">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h4 className="mb-0 fw-bold" style={{ fontSize: '1.2rem' }}>{item.symbol}</h4>
          <span className="text-muted" style={{ fontSize: '0.7rem' }}>NSE · EQUITY</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className={`status-dot ${isMarketOpen ? 'open' : 'closed'}`}>
            {isMarketOpen ? '● LIVE' : '○ CLOSED'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px', color: '#94a3b8', width: '24px', height: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1
            }}
          >×</button>
        </div>
      </div>

      <div className="d-flex align-items-baseline gap-2 mb-3">
        <span className="fs-4 fw-bold">₹{item.price ? item.price.toFixed(2) : '---'}</span>
        <span className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: '0.85rem' }}>
          {isPositive ? '▲' : '▼'} {item.changePercent ? item.changePercent.toFixed(2) : '0.00'}%
        </span>
      </div>

      {news && news.length > 0 ? (
        <div className="detail-news-mini">
          <div className="text-muted mb-2" style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase' }}>Recent Signal</div>
          <a href={news[0].url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
            <div className="news-mini-card">
              <p className="mb-1 text-white" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>{news[0].headline.slice(0, 60)}...</p>
              <span style={{ fontSize: '0.65rem', color: 'var(--dash-primary)' }}>{news[0].source}</span>
            </div>
          </a>
        </div>
      ) : (
        <div className="text-muted small italic">No recent signals found.</div>
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

  const fetchWatchlistFromDB = useCallback(async () => {
    try {
      setLoading(true);
      const data = await watchlistService.getWatchlist();
      setWatchlist(data.length > 0 ? data : DEFAULT_SYMBOLS);
      initialLoadDone.current = true;
    } catch (err) {
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  }, []);

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
        if (quote) results[item.symbol] = { price: quote.c, changePercent: quote.dp };
        if (hist && hist.s === 'ok' && hist.c) historyResults[item.symbol] = hist.c;
      }));
      setQuotes(results);
      setHistory(historyResults);
    } catch (err) { }
  }, [watchlist]);

  useEffect(() => { fetchWatchlistFromDB(); }, [fetchWatchlistFromDB]);

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
        const related = data.filter(n =>
          n.headline?.toLowerCase().includes(selected.symbol.toLowerCase()) ||
          n.related?.includes(selected.symbol)
        ).slice(0, 1);
        setNews(related.length > 0 ? related : data.slice(0, 1));
      });
    }
  }, [selected]);

  const handleAddSymbol = async (e) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol || watchlist.find(w => w.symbol === symbol)) { setNewSymbol(''); return; }
    try {
      const newItem = await watchlistService.addToWatchlist(symbol);
      setWatchlist(prev => [newItem, ...prev]);
      setNewSymbol('');
    } catch (err) {
      setError("Add failed");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemove = async (symbol) => {
    try {
      await watchlistService.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
      if (selected?.symbol === symbol) setSelected(null);
    } catch (err) { }
  };

  const enrichedList = watchlist.map(item => ({
    ...item,
    price: quotes[item.symbol]?.price ?? null,
    changePercent: quotes[item.symbol]?.changePercent ?? null,
    history: history[item.symbol] ?? null,
  }));

  const selectedEnriched = selected ? enrichedList.find(s => s.symbol === selected.symbol) : null;

  return (
    <div className="watch-card-redesign d-flex flex-column">
      <div className="watch-header-redesign">
        <h6 className="watch-title-redesign">
          <span style={{ color: 'var(--dash-primary)' }}>📊</span> Market Watch
        </h6>
        <span className="badge-count-redesign">{watchlist.length}</span>
      </div>

      <form onSubmit={handleAddSymbol} className="mb-3 position-relative">
        <input
          type="text"
          className="watch-search-input"
          placeholder="Add asset symbol..."
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
        />
        <i className="bi bi-plus-circle-dotted position-absolute" style={{ right: '15px', top: '10px', color: 'var(--dash-primary)' }}></i>
      </form>

      <div className="flex-grow-1 overflow-auto pe-1 custom-scrollbar">
        {loading && watchlist.length === 0 ? (
          <div className="text-center p-3 opacity-50 small">Syncing...</div>
        ) : (
          enrichedList.map((item) => (
            <WatchlistRow
              key={item.symbol}
              item={item}
              isSelected={selected?.symbol === item.symbol}
              onClick={setSelected}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>

      {selectedEnriched && (
        <DetailPanel item={selectedEnriched} news={news} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

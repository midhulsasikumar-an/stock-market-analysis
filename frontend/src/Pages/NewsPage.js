import React, { useEffect, useState, useCallback } from 'react';
import { fetchMarketNews, fetchQuote, fetchCandles } from '../services/finnhub';
import watchlistService from '../services/watchlistService';
import './NewsPage.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const relativeTime = (ts) => {
    const d = Date.now() - ts * 1000;
    const m = Math.floor(d / 60000), h = Math.floor(d / 3600000), day = Math.floor(d / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (day === 1) return 'Yesterday';
    return new Date(ts * 1000).toLocaleDateString();
};

const getTicker = (headline, related) => {
    if (related?.length > 0) return related.split(',')[0].trim();
    const m = headline?.match(/\b([A-Z]{2,5})\b/);
    return m ? m[1] : null;
};

const getSentiment = (headline) => {
    const h = headline?.toLowerCase() || '';
    const bullish = ['surge', 'rally', 'gain', 'rise', 'beat', 'soar', 'jump', 'grow', 'profit', 'record', 'strong', 'high', 'optimism', 'positive'];
    const bearish = ['drop', 'fall', 'plunge', 'crash', 'decline', 'loss', 'weak', 'warning', 'miss', 'cut', 'low', 'sell', 'pessimism', 'negative'];
    if (bullish.some(w => h.includes(w))) return 'bullish';
    if (bearish.some(w => h.includes(w))) return 'bearish';
    return 'neutral';
};

const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
};

const CATEGORIES = [
    { label: 'All', id: 'general' },
    { label: 'Markets', id: 'general' },
    { label: 'Crypto', id: 'crypto' },
    { label: 'Forex', id: 'forex' },
    { label: 'Merger', id: 'merger' },
    { label: 'Tech', id: 'general' },
    { label: 'Energy', id: 'general' }
];

const MARKET_INDICES = [
    { label: 'SENSEX', value: '+0.84%', up: true },
    { label: 'NIFTY', value: '+0.63%', up: true },
    { label: 'NASDAQ', value: '-0.47%', up: false },
    { label: 'DOW', value: '-0.29%', up: false },
    { label: 'S&P 500', value: '+0.12%', up: true },
];

const TRENDING_TICKERS = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMD'];

const MARKET_MOOD = {
    label: 'Cautiously Bullish',
    color: '#2ef08a',
    summary: 'Investors are optimistic about the upcoming earnings season. Inflation cooling down provides room for potential rate stabilization.',
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ prices, up }) => {
    if (!prices || prices.length < 2) return null;
    const slice = prices.slice(-10);
    const min = Math.min(...slice), max = Math.max(...slice);
    const range = max - min || 1;
    const pts = slice.map((p, i) => `${(i / (slice.length - 1)) * 60},${18 - ((p - min) / range) * 14}`).join(' ');
    return (
        <svg width="60" height="20" style={{ display: 'block' }}>
            <polyline points={pts} fill="none" stroke={up ? '#2ef08a' : '#ff3e3e'} strokeWidth="1.5" />
        </svg>
    );
};

// ─── Featured News Card ───────────────────────────────────────────────────────
const FeaturedCard = ({ item }) => {
    if (!item) return null;
    const ticker = getTicker(item.headline, item.related);
    const sentiment = getSentiment(item.headline);
    return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="np-featured-card">
            <div className="np-featured-meta">
                <span className="np-source-badge">{item.source}</span>
                <span className="np-time">{relativeTime(item.datetime)}</span>
                {ticker && <span className="np-ticker-tag">{ticker}</span>}
                <span className={`np-sentiment ${sentiment}`}>{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}</span>
            </div>
            <h2 className="np-featured-title">{item.headline}</h2>
            <p className="np-featured-summary">
                {stripHtml(item.summary)?.slice(0, 180) || 'Click to read the full story on ' + item.source + '.'}...
            </p>
            <div className="np-featured-cta">Read Full Story →</div>
        </a>
    );
};

// ─── News Grid Card ───────────────────────────────────────────────────────────
const NewsCard = ({ item }) => {
    const ticker = getTicker(item.headline, item.related);
    const sentiment = getSentiment(item.headline);
    return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="np-news-card">
            <div className="np-thumbnail-placeholder">
                {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : <span>📰</span>}
            </div>
            <div className="np-card-top">
                <span className="np-source-badge">{item.source}</span>
                <span className="np-time">{relativeTime(item.datetime)}</span>
                <span className={`np-sentiment ${sentiment}`}>{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}</span>
            </div>
            <h4 className="np-card-headline">{item.headline}</h4>
            {ticker && <span className="np-ticker-tag" style={{ marginTop: '0.8rem', width: 'fit-content' }}>{ticker}</span>}
        </a>
    );
};

// ─── Watchlist Sidebar ────────────────────────────────────────────────────────
const WatchSidebar = ({ onSymbolSelect, selectedSymbol }) => {
    const [list, setList] = useState([]);
    const [quotes, setQuotes] = useState({});
    const [candles, setCandles] = useState({});
    const [filter, setFilter] = useState('');

    useEffect(() => {
        watchlistService.getWatchlist().then(data => {
            const items = data.length > 0 ? data : [
                { symbol: 'AAPL' }, { symbol: 'TSLA' }, { symbol: 'NVDA' }, { symbol: 'MSFT' }, { symbol: 'META' },
            ];
            setList(items);
            items.forEach(async ({ symbol }) => {
                const [q, c] = await Promise.all([fetchQuote(symbol), fetchCandles(symbol, 'D', 7)]);
                if (q) setQuotes(prev => ({ ...prev, [symbol]: q }));
                if (c?.s === 'ok') setCandles(prev => ({ ...prev, [symbol]: c.c }));
            });
        }).catch(() => { });
    }, []);

    const filtered = list.filter(i => i.symbol.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="np-watch-panel">
            <div className="np-panel-title">📊 Market Watch</div>
            <input
                className="np-watch-search"
                placeholder="Filter symbols..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
            <div className="np-watch-list">
                {filtered.map(({ symbol }) => {
                    const q = quotes[symbol];
                    const c = candles[symbol];
                    const up = (q?.dp ?? 0) >= 0;
                    const isActive = selectedSymbol === symbol;
                    return (
                        <div key={symbol} className={`np-watch-row ${isActive ? 'active' : ''}`} onClick={() => onSymbolSelect(isActive ? null : symbol)}>
                            <div className="np-watch-badge">{symbol.slice(0, 4)}</div>
                            <div className="np-watch-info">
                                <span className="np-watch-sym">{symbol}</span>
                                <Sparkline prices={c} up={up} />
                            </div>
                            <div className="np-watch-price">
                                <div className="np-watch-val">${q?.c?.toFixed(2) ?? '---'}</div>
                                <div className={`np-watch-chg ${up ? 'up' : 'down'}`}>
                                    {up ? '+' : ''}{q?.dp?.toFixed(2) ?? '0.00'}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedSymbol && (
                <button className="np-clear-filter" onClick={() => onSymbolSelect(null)}>Clear Filter</button>
            )}
        </div>
    );
};

// ─── Trending Sidebar ─────────────────────────────────────────────────────────
const TrendingSidebar = ({ onSymbolSelect }) => (
    <div className="np-panel np-trending-panel">
        <div className="np-panel-title">🔥 Trending</div>
        {TRENDING_TICKERS.map((t, i) => (
            <div key={t} className="np-trending-row" onClick={() => onSymbolSelect(t)}>
                <span className="np-trend-rank">#{i + 1}</span>
                <span className="np-trend-sym">{t}</span>
                <span className="np-trend-fire">🔥</span>
            </div>
        ))}
    </div>
);

// ─── Market Mood ──────────────────────────────────────────────────────────────
const MoodBox = () => (
    <div className="np-panel np-mood-panel">
        <div className="np-panel-title">🧠 Market Mood</div>
        <div className="np-mood-label" style={{ color: MARKET_MOOD.color }}>{MARKET_MOOD.label}</div>
        <p className="np-mood-text">{MARKET_MOOD.summary}</p>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewsPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedSymbol, setSelectedSymbol] = useState(null);

    const loadNews = useCallback(async () => {
        setLoading(true);
        try {
            const catObj = CATEGORIES.find(c => c.label === activeTab) || CATEGORIES[0];
            const data = await fetchMarketNews(selectedSymbol, catObj.id);
            setNews(data || []);
        } catch (e) { setNews([]); }
        finally { setLoading(false); }
    }, [activeTab, selectedSymbol]);

    useEffect(() => { loadNews(); }, [loadNews]);

    const itemsToShow = news.length > 0 ? news : [];
    const featured = itemsToShow[0];
    const rest = itemsToShow.slice(1);

    return (
        <div className="np-root">
            {/* Market Snapshot Bar */}
            <div className="np-snapshot-bar">
                {MARKET_INDICES.map(idx => (
                    <div key={idx.label} className="np-snapshot-item">
                        <span className="np-snap-label">{idx.label}</span>
                        <span className={`np-snap-value ${idx.up ? 'up' : 'down'}`}>{idx.value}</span>
                    </div>
                ))}
                <span className="np-snap-time ms-auto">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
            </div>

            <div className="np-body">
                {/* Left Main (70%) */}
                <div className="np-main">
                    <div className="np-page-header">
                        <h1 className="np-page-title">
                            {selectedSymbol ? `News for ${selectedSymbol}` : 'Market News'}
                        </h1>
                        <p className="np-page-sub">Latest financial intelligence and real-time updates</p>
                    </div>

                    {/* Tabs */}
                    <div className="np-tab-bar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.label}
                                className={`np-tab ${activeTab === cat.label ? 'active' : ''}`}
                                onClick={() => { setActiveTab(cat.label); setSelectedSymbol(null); }}
                            >{cat.label}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="np-loading">
                            <div className="np-spinner" />
                            <span>Fetching data from market feeds...</span>
                        </div>
                    ) : news.length === 0 ? (
                        <div className="np-empty-state empty-state-card empty-state-card--compact">
                            <div className="empty-state-icon" aria-hidden="true">📰</div>
                            <h4 className="empty-state-title">No news available right now</h4>
                            <p className="empty-state-subtitle">
                                Market news refreshes automatically. Check back shortly.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Featured Card */}
                            {featured && <FeaturedCard item={featured} />}

                            {/* News Grid (Two Columns) */}
                            <div className="np-grid">
                                {rest.slice(0, 10).map((item, i) => (
                                    <NewsCard key={item.id || i} item={item} />
                                ))}
                            </div>

                            <div className="np-load-more">
                                <a href="https://finnhub.io/news" target="_blank" rel="noopener noreferrer" className="np-more-btn">
                                    View More on Finnhub →
                                </a>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Sidebar (30%) */}
                <aside className="np-sidebar">
                    <WatchSidebar onSymbolSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} />
                    <TrendingSidebar onSymbolSelect={setSelectedSymbol} />
                    <MoodBox />
                </aside>
            </div>
        </div>
    );
}

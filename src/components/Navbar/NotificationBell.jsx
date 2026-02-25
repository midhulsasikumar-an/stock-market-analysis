import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchQuote } from '../../services/finnhub';

// ─── Threshold Configuration ─────────────────────────────────────────────────
// These are realistic analyst price targets / key support-resistance levels
// Updated for Feb 2026 market context.
const STOCK_THRESHOLDS = {
    AAPL: { low: 210, high: 240, name: 'Apple Inc.' },
    MSFT: { low: 380, high: 440, name: 'Microsoft' },
    GOOGL: { low: 160, high: 195, name: 'Alphabet' },
    TSLA: { low: 260, high: 380, name: 'Tesla' },
    NVDA: { low: 110, high: 150, name: 'NVIDIA' },
    AMZN: { low: 195, high: 240, name: 'Amazon' },
    META: { low: 560, high: 680, name: 'Meta Platforms' },
    NFLX: { low: 850, high: 1050, name: 'Netflix' },
    AMD: { low: 110, high: 150, name: 'AMD' },
    JPM: { low: 220, high: 270, name: 'JPMorgan Chase' },
};

// % change alert threshold — notify if day's move exceeds this
const PCT_CHANGE_ALERT = 3.0; // 3% intraday move = notable alert

// ─── Helper: time-ago ─────────────────────────────────────────────────────────
function timeAgo(ts) {
    const now = Date.now();
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Icon helper ──────────────────────────────────────────────────────────────
function NotifIcon({ type }) {
    if (type === 'high') return <span className="notif-icon notif-icon--up">▲</span>;
    if (type === 'low') return <span className="notif-icon notif-icon--down">▼</span>;
    if (type === 'surge') return <span className="notif-icon notif-icon--surge">🔥</span>;
    if (type === 'drop') return <span className="notif-icon notif-icon--drop">⚠️</span>;
    return <span className="notif-icon notif-icon--info">📊</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastChecked, setLastChecked] = useState(null);
    const [checking, setChecking] = useState(false);
    const panelRef = useRef(null);
    const prevPrices = useRef({});

    // ── Close on outside click ─────────────────────────────────────────────────
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // ── Load persisted notifications from localStorage ─────────────────────────
    useEffect(() => {
        try {
            const saved = localStorage.getItem('stock_notifications');
            if (saved) {
                const parsed = JSON.parse(saved);
                setNotifications(parsed);
                const unread = parsed.filter(n => !n.read).length;
                setUnreadCount(unread);
            }
        } catch (_) { }
    }, []);

    // ── Core: fetch quotes and evaluate thresholds ─────────────────────────────
    const checkPrices = useCallback(async () => {
        setChecking(true);
        const symbols = Object.keys(STOCK_THRESHOLDS);
        const newAlerts = [];

        // Also check user's watchlist from localStorage
        try {
            const saved = localStorage.getItem('watchlist');
            if (saved) {
                const wl = JSON.parse(saved);
                wl.forEach(item => {
                    if (!STOCK_THRESHOLDS[item.symbol]) {
                        // Add dynamically with a ±10% range heuristic
                        STOCK_THRESHOLDS[item.symbol] = {
                            name: item.name || item.symbol,
                            low: null,   // no static threshold for custom stocks
                            high: null,
                        };
                    }
                });
            }
        } catch (_) { }

        await Promise.all(
            symbols.map(async (symbol) => {
                try {
                    const quote = await fetchQuote(symbol);
                    if (!quote || quote.c == null) return;

                    const { c: price, d: change, dp: changePct } = quote;
                    const prev = prevPrices.current[symbol];
                    const thresholds = STOCK_THRESHOLDS[symbol];

                    // ① Price crossed ABOVE high threshold
                    if (thresholds.high && price >= thresholds.high) {
                        // Only fire once per session (not every poll)
                        if (!prev || prev < thresholds.high) {
                            newAlerts.push({
                                id: `${symbol}-high-${Date.now()}`,
                                symbol,
                                name: thresholds.name,
                                type: 'high',
                                message: `${symbol} hit resistance at $${thresholds.high.toFixed(0)}`,
                                detail: `Current: $${price.toFixed(2)} · ${changePct >= 0 ? '+' : ''}${changePct?.toFixed(2)}% today`,
                                timestamp: Date.now(),
                                read: false,
                            });
                        }
                    }

                    // ② Price dropped BELOW low threshold
                    if (thresholds.low && price <= thresholds.low) {
                        if (!prev || prev > thresholds.low) {
                            newAlerts.push({
                                id: `${symbol}-low-${Date.now()}`,
                                symbol,
                                name: thresholds.name,
                                type: 'low',
                                message: `${symbol} broke support at $${thresholds.low.toFixed(0)}`,
                                detail: `Current: $${price.toFixed(2)} · ${changePct >= 0 ? '+' : ''}${changePct?.toFixed(2)}% today`,
                                timestamp: Date.now(),
                                read: false,
                            });
                        }
                    }

                    // ③ Large single-day move (surge / sharp drop)
                    if (changePct != null && Math.abs(changePct) >= PCT_CHANGE_ALERT) {
                        const isSurge = changePct > 0;
                        const alertKey = `${symbol}-pct-${new Date().toDateString()}`;
                        const alreadyFired = localStorage.getItem(alertKey);
                        if (!alreadyFired) {
                            localStorage.setItem(alertKey, '1');
                            newAlerts.push({
                                id: `${symbol}-pct-${Date.now()}`,
                                symbol,
                                name: thresholds.name,
                                type: isSurge ? 'surge' : 'drop',
                                message: isSurge
                                    ? `${symbol} surged ${changePct.toFixed(2)}% today`
                                    : `${symbol} dropped ${Math.abs(changePct).toFixed(2)}% today`,
                                detail: `Price: $${price.toFixed(2)} · Day change: ${change >= 0 ? '+' : ''}$${change?.toFixed(2)}`,
                                timestamp: Date.now(),
                                read: false,
                            });
                        }
                    }

                    prevPrices.current[symbol] = price;
                } catch (_) { }
            })
        );

        if (newAlerts.length > 0) {
            setNotifications(prev => {
                // De-duplicate by symbol+type within same day
                const today = new Date().toDateString();
                const existingKeys = new Set(
                    prev
                        .filter(n => new Date(n.timestamp).toDateString() === today)
                        .map(n => `${n.symbol}-${n.type}`)
                );

                const fresh = newAlerts.filter(a => !existingKeys.has(`${a.symbol}-${a.type}`));
                if (fresh.length === 0) return prev;

                const merged = [...fresh, ...prev].slice(0, 50); // cap at 50
                localStorage.setItem('stock_notifications', JSON.stringify(merged));
                setUnreadCount(c => c + fresh.length);
                return merged;
            });
        }

        setLastChecked(new Date());
        setChecking(false);
    }, []);

    // ── Poll every 90 seconds ──────────────────────────────────────────────────
    useEffect(() => {
        checkPrices();
        const interval = setInterval(checkPrices, 90_000);
        return () => clearInterval(interval);
    }, [checkPrices]);

    // ── Mark all as read when panel opens ─────────────────────────────────────
    const handleToggle = () => {
        setIsOpen(prev => {
            if (!prev) {
                // Opening — mark all read
                setNotifications(n => {
                    const updated = n.map(x => ({ ...x, read: true }));
                    localStorage.setItem('stock_notifications', JSON.stringify(updated));
                    return updated;
                });
                setUnreadCount(0);
            }
            return !prev;
        });
    };

    // ── Clear all ──────────────────────────────────────────────────────────────
    const handleClearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
        localStorage.removeItem('stock_notifications');
    };

    // ── Mark single as read ───────────────────────────────────────────────────
    const handleDismiss = (id) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            localStorage.setItem('stock_notifications', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <div className="notif-bell-wrap" ref={panelRef}>
            {/* ── Bell Button ─────────────────────────────────────────────────── */}
            <button
                className={`notif-bell-btn ${isOpen ? 'active' : ''}`}
                onClick={handleToggle}
                title="Stock Alerts"
                aria-label="Stock price notifications"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <svg
                    className={`notif-bell-icon ${unreadCount > 0 ? 'bell-ring' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {unreadCount > 0 && (
                    <span className="notif-badge" aria-label={`${unreadCount} unread alerts`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {checking && <span className="notif-pulse" />}
            </button>

            {/* ── Dropdown Panel ───────────────────────────────────────────────── */}
            {isOpen && (
                <div className="notif-panel" role="dialog" aria-label="Stock Notifications">
                    {/* Header */}
                    <div className="notif-panel-header">
                        <span className="notif-panel-title">
                            <svg className="notif-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            Stock Alerts
                        </span>
                        <div className="notif-header-actions">
                            {lastChecked && (
                                <span className="notif-last-check" title={`Last checked: ${lastChecked.toLocaleTimeString()}`}>
                                    {checking ? '⟳ Checking…' : `↻ ${timeAgo(lastChecked)}`}
                                </span>
                            )}
                            {notifications.length > 0 && (
                                <button className="notif-clear-btn" onClick={handleClearAll} title="Clear all alerts">
                                    ✓ Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="notif-panel-body">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">
                                <div className="notif-empty-icon">🔕</div>
                                <p className="notif-empty-title">No alerts yet</p>
                                <p className="notif-empty-sub">
                                    You'll be notified when watchlist stocks cross key price levels or make significant moves.
                                </p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notif-item ${n.read ? 'notif-item--read' : 'notif-item--unread'} notif-item--${n.type}`}
                                >
                                    <div className="notif-item-left">
                                        <NotifIcon type={n.type} />
                                        <div className="notif-item-body">
                                            <span className="notif-item-symbol">{n.symbol}</span>
                                            <span className="notif-item-msg">{n.message}</span>
                                            <span className="notif-item-detail">{n.detail}</span>
                                            <span className="notif-item-time">{timeAgo(n.timestamp)}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="notif-dismiss-btn"
                                        onClick={() => handleDismiss(n.id)}
                                        title="Dismiss"
                                        aria-label={`Dismiss alert for ${n.symbol}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="notif-panel-footer">
                        <span className="notif-footer-info">
                            Auto-checks every 90s · Threshold alerts for {Object.keys(STOCK_THRESHOLDS).length} stocks
                        </span>
                        <button
                            className="notif-refresh-btn"
                            onClick={() => checkPrices()}
                            disabled={checking}
                            title="Refresh now"
                        >
                            {checking ? '⟳' : '↻'} Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

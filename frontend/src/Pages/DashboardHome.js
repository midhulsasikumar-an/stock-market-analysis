import React, { useEffect, useMemo, useState } from 'react';
import HeroDash from '../components/Hero_Dash';
import StockDash from '../components/Stock_Dash';
import MarketOverviewDash from '../components/Market_Overview_Dash';
import MarketNewsDash from '../components/Market_News_Dash';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DISMISSED_KEY = 'dismissedAnnouncements';

function getDismissedAnnouncementIds() {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
    } catch {
        return [];
    }
}

function setDismissedAnnouncementIds(ids) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

function getBannerStyle(severity) {
    const value = String(severity || '').toLowerCase();
    if (value === 'maintenance') {
        return {
            background: 'rgba(239, 68, 68, 0.12)',
            borderLeft: '4px solid #ef4444',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            color: '#fecaca'
        };
    }

    if (value === 'warning') {
        return {
            background: 'rgba(245, 158, 11, 0.12)',
            borderLeft: '4px solid #f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            color: '#fde68a'
        };
    }

    return {
        background: 'rgba(59, 130, 246, 0.12)',
        borderLeft: '4px solid #3b82f6',
        border: '1px solid rgba(59, 130, 246, 0.28)',
        color: '#bfdbfe'
    };
}

export default function DashboardHome() {
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        document.title = 'Dashboard — TradeTrack';
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadAnnouncements = async () => {
            try {
                const response = await fetch(`${API_URL}/api/announcements/active`);
                const payload = await response.json().catch(() => ({ success: false, data: [] }));
                if (!mounted || !payload?.success) return;

                const dismissedIds = getDismissedAnnouncementIds();
                const visible = (payload.data || []).filter((item) => !dismissedIds.includes(String(item._id)));
                setAnnouncements(visible);
            } catch {
                if (mounted) setAnnouncements([]);
            }
        };

        loadAnnouncements();
        return () => { mounted = false; };
    }, []);

    const visibleAnnouncements = useMemo(() => {
        return [...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [announcements]);

    const handleDismiss = (announcementId) => {
        const id = String(announcementId);
        setAnnouncements((current) => current.filter((item) => String(item._id) !== id));

        const dismissedIds = getDismissedAnnouncementIds();
        if (!dismissedIds.includes(id)) {
            const next = [...dismissedIds, id];
            setDismissedAnnouncementIds(next);
        }
    };

    return (
        <div>
            {visibleAnnouncements.length > 0 ? (
                <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                    {visibleAnnouncements.map((announcement) => {
                        const style = getBannerStyle(announcement.severity);

                        return (
                            <div
                                key={announcement._id}
                                style={{
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    alignItems: 'flex-start',
                                    ...style
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{announcement.title}</div>
                                    <div style={{ fontSize: '0.92rem', lineHeight: 1.45 }}>{announcement.message}</div>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Dismiss announcement"
                                    onClick={() => handleDismiss(announcement._id)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: style.color,
                                        fontSize: 18,
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        cursor: 'pointer'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            <HeroDash />
            <MarketOverviewDash />
            <StockDash />
            <MarketNewsDash />
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { fetchMarketNews } from '../services/finnhub';

// Helper: Convert timestamp to relative time
const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
};

// Helper: Extract asset tag from headline or related symbols
const getAssetTag = (headline, related) => {
  if (related && related.length > 0) {
    return related.split(',')[0].trim();
  }
  const match = headline.match(/\b([A-Z]{2,5}\/[A-Z]{2,5}|[A-Z]{2,5})\b/);
  return match ? match[1] : null;
};

// NewsItem Component — original style
const NewsItem = ({ headline, source, datetime, related, url }) => {
  const relativeTime = getRelativeTime(datetime);
  const assetTag = getAssetTag(headline, related);

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="news-item">
      <div className="news-item-badge">
        {assetTag ? (
          <span className="asset-tag">{assetTag}</span>
        ) : (
          <span className="asset-tag generic">📰</span>
        )}
      </div>
      <div className="news-item-content">
        <p className="news-meta">{source} • {relativeTime}</p>
        <h4 className="news-headline">{headline}</h4>
      </div>
    </a>
  );
};

export default function Market_News_Dash() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMarketNews(null, "general");
        if (data && data.length > 0) {
          setNews(data.slice(0, 10));
        } else {
          setNews([]);
        }
      } catch (err) {
        setError("Failed to load news.");
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

  return (
    <section className="container my-5 text-white market-news-section">
      <div className="market-news-header">
        <h2 className="section-title">
          <span className="title-icon">📰</span> Market News
        </h2>
      </div>

      {loading && (
        <div className="news-loading">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          <span className="text-muted">Fetching latest news...</span>
        </div>
      )}

      {error && !loading && (
        <div className="news-error">
          <p className="text-danger mb-0">{error}</p>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="news-empty">
          <p className="text-muted mb-0">No news available at the moment.</p>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <>
          <div className="news-grid">
            {news.map((item, index) => (
              <NewsItem
                key={item.id || index}
                headline={item.headline}
                source={item.source}
                datetime={item.datetime}
                related={item.related}
                url={item.url}
              />
            ))}
          </div>
          <div className="news-footer">
            <a
              href="https://finnhub.io/news"
              target="_blank"
              rel="noopener noreferrer"
              className="keep-reading-link"
            >
              Keep reading →
            </a>
          </div>
        </>
      )}
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import './Matches.css';

const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:4000';

function Matches() {
  const [links, setLinks] = useState([]);
  const [cached, setCached] = useState(false);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [nextRefreshAt, setNextRefreshAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchYoutubeLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${PROXY_URL}/matches/youtube-links`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setLinks(data.links || []);
      setCached(data.cached || false);
      setFetchedAt(data.fetchedAt || null);
      setNextRefreshAt(data.nextRefreshAt || null);
    } catch (err) {
      console.error('Failed to fetch YouTube links:', err);
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYoutubeLinks();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="matches-page">
        <div className="matches-header">
          <h1 className="matches-title">Live Matches</h1>
          <p className="matches-subtitle">Live streams from YouTube</p>
        </div>
        <div className="matches-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="skeleton-thumb" />
              <div className="skeleton-body">
                <div className="skeleton-line w-40" />
                <div className="skeleton-line w-80" />
                <div className="skeleton-line w-60" />
                <div className="skeleton-line h-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="matches-page">
        <div className="matches-header">
          <h1 className="matches-title">Live Matches</h1>
          <p className="matches-subtitle">Live streams from YouTube</p>
        </div>
        <div className="matches-state">
          <div className="matches-state-icon">⚠️</div>
          <h2 className="matches-state-title">Failed to load matches</h2>
          <p className="matches-state-text">{error}</p>
          <button className="matches-retry-btn" onClick={fetchYoutubeLinks}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (links.length === 0) {
    return (
      <div className="matches-page">
        <div className="matches-header">
          <h1 className="matches-title">Live Matches</h1>
          <p className="matches-subtitle">Live streams from YouTube</p>
        </div>
        <div className="matches-state">
          <div className="matches-state-icon">📺</div>
          <h2 className="matches-state-title">No live matches right now</h2>
          <p className="matches-state-text">
            Check back later for live streams. Channels are checked every 2 hours.
          </p>
          <button className="matches-retry-btn" onClick={fetchYoutubeLinks}>
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="matches-page">
      <div className="matches-header">
        <h1 className="matches-title">Live Matches</h1>
        <p className="matches-subtitle">Live streams from YouTube</p>

        {cached && (
          <div className="cache-badge">
            <span className="dot" />
            From cache &bull; refreshes every 2hr
          </div>
        )}

        {nextRefreshAt && (
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Next refresh at: {formatTime(nextRefreshAt)}
          </p>
        )}
      </div>

      <div className="matches-grid">
        {links.map((link, index) => (
          <div
            key={link.channelId || index}
            className="yt-card animate-slide-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Thumbnail */}
            <div className="yt-card-thumbnail">
              {link.thumbnailUrl ? (
                <img
                  src={link.thumbnailUrl}
                  alt={link.videoTitle || link.channelName}
                  loading="lazy"
                />
              ) : (
                <div className="yt-card-thumbnail-placeholder">📺</div>
              )}

              {/* Live / Offline badge */}
              {link.isLive ? (
                <span className="badge-live">🔴 LIVE</span>
              ) : (
                <span className="badge-offline">Offline</span>
              )}
            </div>

            {/* Card Body */}
            <div className="yt-card-body">
              <div className="yt-card-channel">{link.channelName}</div>
              <div className="yt-card-title">
                {link.videoTitle || (link.isLive ? 'Live Stream' : 'Not currently streaming')}
              </div>

              {link.isLive && link.videoUrl ? (
                <a
                  href={link.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-card-btn yt-card-btn-live"
                >
                  ▶ Watch on YouTube
                </a>
              ) : (
                <button className="yt-card-btn yt-card-btn-offline" disabled>
                  Not Live
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Matches;

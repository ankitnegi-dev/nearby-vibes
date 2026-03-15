import React from 'react';
import { getStats, getHistory, getFavourites, clearHistory } from '../utils/storage';
import { MOODS } from '../services/placesAPI';
import { timeAgo } from '../utils/filters';
import './StatsDashboard.css';

export default function StatsDashboard({ onClose, theme }) {
  const stats   = getStats();
  const history = getHistory();
  const favs    = getFavourites();

  const topMood = Object.entries(stats.moodCounts || {})
    .sort((a,b) => b[1]-a[1])[0];

  return (
    <div className={`dash-overlay ${theme}`} onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="dash-panel">
        <div className="dash-header">
          <div className="dash-title">📊 Your Stats</div>
          <button className="dash-close" onClick={onClose}>✕</button>
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-val">{stats.totalSearches}</div>
            <div className="stat-label">Searches</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats.placesViewed}</div>
            <div className="stat-label">Places Viewed</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{favs.length}</div>
            <div className="stat-label">Favourites</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{(stats.citiesVisited||[]).length}</div>
            <div className="stat-label">Cities</div>
          </div>
        </div>

        {/* Top mood */}
        {topMood && (
          <div className="top-mood">
            <span>🏆 Favourite mood:</span>
            <span className="top-mood-val">
              {MOODS[topMood[0]]?.emoji} {MOODS[topMood[0]]?.label} ({topMood[1]}x)
            </span>
          </div>
        )}

        {/* Mood breakdown */}
        {Object.keys(stats.moodCounts||{}).length > 0 && (
          <div className="mood-breakdown">
            <div className="section-title">Mood Breakdown</div>
            {Object.entries(stats.moodCounts).sort((a,b)=>b[1]-a[1]).map(([id,count])=>{
              const m = MOODS[id];
              const pct = Math.round((count/stats.totalSearches)*100);
              return (
                <div key={id} className="mood-bar-row">
                  <span className="mood-bar-label">{m?.emoji} {m?.label}</span>
                  <div className="mood-bar-track">
                    <div className="mood-bar-fill" style={{width:`${pct}%`, background: m?.color}}/>
                  </div>
                  <span className="mood-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <div className="history-section">
            <div className="section-row">
              <div className="section-title">🕒 Recent Searches</div>
              <button className="clear-btn" onClick={() => { clearHistory(); window.location.reload(); }}>Clear</button>
            </div>
            <div className="history-list">
              {history.slice(0,8).map((h,i) => (
                <div key={i} className="history-item">
                  <span className="history-emoji">{MOODS[h.moodId]?.emoji || '📍'}</span>
                  <div className="history-info">
                    <div className="history-mood">{MOODS[h.moodId]?.label || h.moodId}</div>
                    <div className="history-meta">{h.city || 'Unknown'} · {timeAgo(h.visitedAt)}</div>
                  </div>
                  <span className="history-count">{h.count} places</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.totalSearches === 0 && (
          <div className="dash-empty">Start searching to see your stats here! 🚀</div>
        )}
      </div>
    </div>
  );
}

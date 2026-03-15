import React from 'react';
import { getFavourites, toggleFavourite } from '../utils/storage';
import { fmtDist, stars, timeAgo } from '../utils/filters';
import './FavouritesPanel.css';

export default function FavouritesPanel({ onClose, onSelectPlace, theme }) {
  const favs = getFavourites();

  const remove = (place, e) => {
    e.stopPropagation();
    toggleFavourite(place);
    window.dispatchEvent(new Event('favsUpdated'));
  };

  return (
    <div className={`favs-overlay ${theme}`} onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="favs-panel">
        <div className="favs-header">
          <div className="favs-title">⭐ Favourites</div>
          <button className="favs-close" onClick={onClose}>✕</button>
        </div>

        {favs.length === 0
          ? <div className="favs-empty">
              <div style={{fontSize:44}}>⭐</div>
              <p>No favourites yet.<br/>Tap the ⭐ on any place to save it!</p>
            </div>
          : <div className="favs-list">
              {favs.map(p => (
                <div key={p.id} className="fav-card" onClick={() => { onSelectPlace(p); onClose(); }}>
                  <div className="fav-main">
                    <div className="fav-name">{p.name}</div>
                    <div className="fav-type">{p.type}</div>
                    <div className="fav-stars">{stars(p.rating)} <span>{p.rating}</span></div>
                    <div className="fav-meta">
                      {p.dist && <span>📍 {fmtDist(p.dist)}</span>}
                      <span className={p.open ? 'open' : 'closed'}>{p.open ? '🟢 Open' : '🔴 Closed'}</span>
                      <span>· {timeAgo(p.savedAt)}</span>
                    </div>
                  </div>
                  <button className="fav-remove" onClick={e => remove(p, e)}>🗑️</button>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

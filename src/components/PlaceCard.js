import React, { useState } from 'react';
import { fmtDist, stars } from '../utils/filters';
import { isFavourite, toggleFavourite, recordFavourite } from '../utils/storage';
import './PlaceCard.css';

export default function PlaceCard({ place, index, mood, selected, onClick, onRoute, theme }) {
  const [fav, setFav] = useState(isFavourite(place.id));
  const [copied, setCopied] = useState(false);

  const handleFav = (e) => {
    e.stopPropagation();
    const added = toggleFavourite(place);
    if(added) recordFavourite();
    setFav(!fav);
    window.dispatchEvent(new Event('favsUpdated'));
  };

  const handleShare = (e) => {
  e.stopPropagation();
  const mapsUrl = `https://www.google.com/maps?q=${place.lat},${place.lon}`;
  const text = `📍 ${place.name}\n⭐ ${place.rating} stars · ${fmtDist(place.dist)} away\n🗺️ ${mapsUrl}`;

  // WhatsApp share URL
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  if (navigator.share) {
    // Mobile native share
    navigator.share({ title: place.name, text, url: mapsUrl });
  } else {
    // Desktop — copy to clipboard AND open WhatsApp in new tab
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    window.open(waUrl, '_blank');
  }
};
  const handleRoute = (e) => {
    e.stopPropagation();
    onRoute && onRoute(place);
  };

  return (
    <div className={`place-card ${selected?'selected':''} ${theme}`} onClick={onClick} style={{'--accent':mood.color}}>
      <div className="place-num">{index}</div>
      <div className="place-main">
        <div className="place-name">{place.name}</div>
        {place.nameLocal && <div className="place-local">{place.nameLocal}</div>}
        <div className="place-type">{place.type}</div>
        <div className="place-stars">{stars(place.rating)} <span>{place.rating}</span></div>
        <div className="place-actions">
          <button className={`action-btn fav-btn ${fav?'active':''}`} onClick={handleFav} title="Favourite">
            {fav?'⭐':'☆'}
          </button>
          <button className="action-btn" onClick={handleShare} title="Share">
            {copied?'✓':'📤'}
          </button>
          <button className="action-btn" onClick={handleRoute} title="Route">🗺️</button>
        </div>
      </div>
      <div className="place-meta">
        <div className="place-dist">{fmtDist(place.dist)}</div>
        <div className={`open-badge ${place.open?'open':'closed'}`}>{place.open?'Open':'Closed'}</div>
      </div>
    </div>
  );
}

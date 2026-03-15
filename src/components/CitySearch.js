import React, { useState, useRef } from 'react';
import { geocodeCity } from '../services/placesAPI';
import './CitySearch.css';

export default function CitySearch({ onSelectCity, theme }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const search = async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await geocodeCity(q);
      setResults(r.slice(0, 5));
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 400);
  };

  const pick = (r) => {
    setQuery(r.shortName);
    setResults([]);
    setShow(false);
    onSelectCity({ lat: r.lat, lon: r.lon, name: r.shortName });
  };

  return (
    <div className={`city-search ${theme}`}>
      {!show
        ? <button className="city-btn" onClick={() => setShow(true)}>🌍 Search any city</button>
        : (
          <div className="city-wrap">
            <div className="city-input-row">
              <span>🌍</span>
              <input
                autoFocus
                className="city-input"
                placeholder="Type a city name…"
                value={query}
                onChange={handleChange}
              />
              {loading && <span className="city-spin">⟳</span>}
              <button className="city-close" onClick={() => { setShow(false); setQuery(''); setResults([]); }}>✕</button>
            </div>
            {results.length > 0 && (
              <div className="city-results">
                {results.map((r, i) => (
                  <div key={i} className="city-result" onClick={() => pick(r)}>
                    <span className="city-result-name">{r.shortName}</span>
                    <span className="city-result-full">{r.displayName.split(',').slice(1, 3).join(',')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
    </div>
  );
}

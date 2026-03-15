import React, { useState, useCallback, useEffect } from 'react';
import MoodSelector from './components/MoodSelector';
import MapView from './components/MapView';
import PlaceCard from './components/PlaceCard';
import EssentialsChecklist from './components/EssentialsChecklist';
import SearchBar from './components/SearchBar';
import StatsDashboard from './components/StatsDashboard';
import FavouritesPanel from './components/FavouritesPanel';
import { fetchPlaces, searchByKeyword, reverseGeocode, MOODS } from './services/placesAPI';
import { filterAndSort, fmtDist, stars } from './utils/filters';
import { getTheme, setTheme, recordSearch, addHistory, recordPlaceView, getFavourites } from './utils/storage';
import './App.css';

export default function App() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [step, setStep]               = useState('mood');
  const [moodId, setMoodId]           = useState(null);
  const [userPos, setUserPos]         = useState(null);
  const [cityName, setCityName]       = useState('');
  const [places, setPlaces]           = useState([]);
  const [selected, setSelected]       = useState(null);
  const [routeTo, setRouteTo]         = useState(null);
  const [sort, setSort]               = useState('dist');
  const [openOnly, setOpenOnly]       = useState(false);
  const [radius, setRadius]           = useState(1500);
  const [error, setError]             = useState('');
  const [loadMsg, setLoadMsg]         = useState('');
  const [activeTab, setActiveTab]     = useState('map');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [theme, setThemeState]        = useState(getTheme());
  const [showStats, setShowStats]     = useState(false);
  const [showFavs, setShowFavs]       = useState(false);
  const [favCount, setFavCount]       = useState(getFavourites().length);

  const mood      = MOODS[moodId];
  const isNewTown = mood?.isNewTown;
  const display   = searchResults !== null ? searchResults : places;
  const filtered  = filterAndSort(display, sort, openOnly);

  // Listen for favourites changes
  useEffect(() => {
    const handler = () => setFavCount(getFavourites().length);
    window.addEventListener('favsUpdated', handler);
    return () => window.removeEventListener('favsUpdated', handler);
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    setTheme(next);
  };

  // ── Start search with GPS ────────────────────────────────────────────────────
  const startSearch = useCallback(async (id, overridePos = null) => {
    setMoodId(id);
    setStep('loading');
    setSearchResults(null);
    setRouteTo(null);
    setActiveTab(MOODS[id].isNewTown ? 'checklist' : 'map');
    setLoadMsg('Getting your location…');

    const doSearch = async (lat, lon) => {
      setUserPos({ lat, lon });
      setLoadMsg(`Finding ${MOODS[id].label} spots…`);
      try {
        let results = await fetchPlaces(lat, lon, MOODS[id], radius);

        // ── Auto-widen radius if no results ──────────────────────────────────
        if (results.length === 0) {
          setLoadMsg('Nothing nearby… widening search to 5 km…');
          results = await fetchPlaces(lat, lon, MOODS[id], 5000);
        }
        if (results.length === 0) {
          setLoadMsg('Still searching… trying 10 km…');
          results = await fetchPlaces(lat, lon, MOODS[id], 10000);
        }

        setPlaces(results);
        setSelected(null);
        setStep('results');

        // Record stats + history
        const city = await reverseGeocode(lat, lon);
        setCityName(city);
        recordSearch(id, city);
        addHistory({ moodId: id, city, count: results.length });

      } catch {
        setError('Could not fetch places. Overpass API may be busy — please try again.');
        setStep('error');
      }
    };

    if (overridePos) {
      doSearch(overridePos.lat, overridePos.lon);
    } else {
      navigator.geolocation.getCurrentPosition(
        pos => doSearch(pos.coords.latitude, pos.coords.longitude),
        () => {
          setError('Location access denied. Please allow location in your browser.');
          setStep('error');
        }
      );
    }
  }, [radius]);

  // ── City search override ─────────────────────────────────────────────────────
  const handleCitySelect = (city) => {
    setUserPos({ lat: city.lat, lon: city.lon });
    setCityName(city.name);
    // Show mood selector prompt — user still picks mood
    // Just update position, they pick mood next
    alert(`📍 Location set to ${city.name}! Now pick a mood to search.`);
  };

  // ── Keyword search ───────────────────────────────────────────────────────────
  const handleKeywordSearch = async (keyword) => {
    if (!userPos) return;
    setSearchLoading(true);
    setActiveTab('list');
    try {
      const results = await searchByKeyword(userPos.lat, userPos.lon, keyword, 3000);
      setSearchResults(results);
      setSelected(null);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  };

  // ── Select place ─────────────────────────────────────────────────────────────
  const handleSelectPlace = (placeOrId) => {
    const id = typeof placeOrId === 'object' ? placeOrId.id : placeOrId;
    const p  = filtered.find(x => x.id === id) || (typeof placeOrId === 'object' ? placeOrId : null);
    if (p) {
      setSelected(p);
      setActiveTab('map');
      recordPlaceView();
    }
  };

  // ── Route to place ───────────────────────────────────────────────────────────
  const handleRoute = (place) => {
    setRouteTo(place);
    setSelected(place);
    setActiveTab('map');
  };

  // ── Go back ──────────────────────────────────────────────────────────────────
  const goBack = () => {
    setStep('mood');
    setPlaces([]);
    setSearchResults(null);
    setSelected(null);
    setRouteTo(null);
  };

  // ── MOOD SCREEN ──────────────────────────────────────────────────────────────
  if (step === 'mood') return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <MoodSelector
        onSelect={(id) => startSearch(id, userPos)}
        radius={radius} setRadius={setRadius}
        theme={theme} toggleTheme={toggleTheme}
        onShowStats={() => setShowStats(true)}
        onShowFavs={() => setShowFavs(true)}
        favCount={favCount}
        onCitySelect={handleCitySelect}
      />
      {showStats && <StatsDashboard onClose={() => setShowStats(false)} theme={theme}/>}
      {showFavs  && <FavouritesPanel onClose={() => setShowFavs(false)} onSelectPlace={handleSelectPlace} theme={theme}/>}
    </>
  );

  // ── LOADING SCREEN ───────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div className={`loading-screen ${theme}`}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet"/>
      <div className="load-emoji">{mood?.emoji || '📍'}</div>
      <div className="load-text" style={{ color: mood?.color }}>{loadMsg}</div>
      <div className="dots">
        {[0,1,2].map(i => <div key={i} className="dot" style={{ background: mood?.color, animationDelay: `${i*0.2}s` }}/>)}
      </div>
    </div>
  );

  // ── ERROR SCREEN ─────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className={`error-screen ${theme}`}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet"/>
      <div style={{ fontSize: 52 }}>😕</div>
      <div className="err-msg">{error}</div>
      <button className="retry-btn" onClick={goBack}>← Try Again</button>
    </div>
  );

  // ── RESULTS SCREEN ───────────────────────────────────────────────────────────
  const tabs = isNewTown
    ? [{ id:'checklist', label:'📋 Checklist' }, { id:'list', label:'📍 Places' }, { id:'map', label:'🗺️ Map' }]
    : [{ id:'map', label:'🗺️ Map' }, { id:'list', label:'📍 List' }];

  return (
    <div className={`app ${theme}`}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* ── Topbar ── */}
      <div className="topbar">
        <button className="back-btn" onClick={goBack}>←</button>
        <span style={{ fontSize: 22 }}>{mood.emoji}</span>
        <div className="topbar-info">
          <div className="topbar-title">{mood.label}</div>
          <div className="topbar-sub">
            {cityName && `📍 ${cityName} · `}
            {searchResults !== null ? `${searchResults.length} results` : `${mood.desc} · ${(radius/1000).toFixed(1)} km`}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {routeTo && (
            <button className="route-clear-btn" onClick={() => setRouteTo(null)} title="Clear route">🗺️✕</button>
          )}
          <button className="icon-btn-sm" onClick={toggleTheme}>{theme==='dark'?'🌙':'☀️'}</button>
          <button className="icon-btn-sm" onClick={() => setShowStats(true)}>📊</button>
          <button className="icon-btn-sm" onClick={() => setShowFavs(true)}>
            ⭐{favCount > 0 && <span className="badge-sm">{favCount}</span>}
          </button>
        </div>
      </div>

      {/* ── Route banner ── */}
      {routeTo && (
        <div className="route-banner" style={{ background: mood.color + '22', borderColor: mood.color + '44' }}>
          <span>🗺️ Route to <strong>{routeTo.name}</strong> · {fmtDist(routeTo.dist)}</span>
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userPos.lat},${userPos.lon}&destination=${routeTo.lat},${routeTo.lon}&travelmode=walking`}
            target="_blank" rel="noreferrer"
            className="open-maps-btn" style={{ background: mood.color }}>
            Open Maps
          </a>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            style={activeTab === t.id ? { color: mood.color, borderBottomColor: mood.color } : {}}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
        {searchResults !== null && (
          <button className="clear-search-btn" onClick={() => setSearchResults(null)}>✕ Clear</button>
        )}
        <div className="tab-count" style={{ color: mood.color }}>{filtered.length}</div>
      </div>

      {/* ── Content ── */}
      <div className="content-area">

        {/* CHECKLIST TAB */}
        {activeTab === 'checklist' && isNewTown && userPos && (
          <div className="tab-panel">
            <SearchBar onSearch={handleKeywordSearch} loading={searchLoading} color={mood.color} theme={theme}/>
            <EssentialsChecklist userLat={userPos.lat} userLon={userPos.lon} onSelectPlace={handleSelectPlace} theme={theme}/>
          </div>
        )}

        {/* LIST TAB */}
        {activeTab === 'list' && (
          <div className="tab-panel">
            {isNewTown && <SearchBar onSearch={handleKeywordSearch} loading={searchLoading} color={mood.color} theme={theme}/>}
            <div className="filter-bar">
              {['dist','rating'].map(s => (
                <button key={s}
                  className={`filter-btn ${sort===s?'active':''}`}
                  style={sort===s ? { background:mood.color, color:'#0D0D0F', borderColor:mood.color } : {}}
                  onClick={() => setSort(s)}>
                  {s==='dist' ? '📍 Nearest' : '⭐ Top Rated'}
                </button>
              ))}
              <button
                className={`filter-btn ${openOnly?'active':''}`}
                style={openOnly ? { background:mood.color, color:'#0D0D0F', borderColor:mood.color } : {}}
                onClick={() => setOpenOnly(!openOnly)}>
                🟢 Open Now
              </button>
            </div>
            <div className="places-list">
              {searchLoading
                ? <div className="empty-state"><p>Searching…</p></div>
                : filtered.length === 0
                  ? <div className="empty-state"><div style={{fontSize:40}}>🔍</div><p>No places found.</p></div>
                  : filtered.map((p, i) => (
                      <PlaceCard key={p.id} place={p} index={i+1} mood={mood}
                        selected={selected?.id === p.id}
                        onClick={() => handleSelectPlace(p)}
                        onRoute={handleRoute}
                        theme={theme}
                      />
                    ))
              }
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="map-wrap">
            {userPos && (
              <MapView
                places={filtered.slice(0,15)}
                userLat={userPos.lat} userLon={userPos.lon}
                mood={mood} selected={selected} routeTo={routeTo}
                onSelect={id => handleSelectPlace(id)}
                theme={theme}
              />
            )}
            {selected && (
              <div className={`detail-panel ${theme}`}>
                <button className="detail-close" onClick={() => { setSelected(null); setRouteTo(null); }}>✕</button>
                <div className="detail-name">{selected.name}</div>
                {selected.nameLocal && <div className="detail-local">🌐 {selected.nameLocal}</div>}
                <div className="detail-type">{selected.type} · {selected.address}</div>
                <div className="detail-row">
                  <div className="detail-chip" style={{color:mood.color}}>📍 {fmtDist(selected.dist)}</div>
                  <div className="detail-chip">{stars(selected.rating)} {selected.rating}</div>
                  <div className="detail-chip" style={{color:selected.open?'#2DC87A':'#F25882'}}>
                    {selected.open?'🟢 Open':'🔴 Closed'}
                  </div>
                </div>
                <div className="detail-actions">
                  <button className="detail-action-btn" style={{background:mood.color}}
                    onClick={() => handleRoute(selected)}>
                    🗺️ Get Route
                  </button>
                  <button className="detail-action-btn outline"
                    onClick={() => {
                      const text=`📍 ${selected.name}\nhttps://www.google.com/maps?q=${selected.lat},${selected.lon}`;
                      navigator.clipboard?.writeText(text) || window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                    }}>
                    📤 Share
                  </button>
                </div>
                {selected.phone && <a href={`tel:${selected.phone}`} className="detail-contact">📞 {selected.phone}</a>}
                {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="detail-contact">🌐 Website</a>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showStats && <StatsDashboard onClose={() => setShowStats(false)} theme={theme}/>}
      {showFavs  && <FavouritesPanel onClose={() => setShowFavs(false)} onSelectPlace={handleSelectPlace} theme={theme}/>}
    </div>
  );
}

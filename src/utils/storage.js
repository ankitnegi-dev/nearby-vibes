// ── Storage keys ─────────────────────────────────────────────────────────────
const KEYS = {
  FAVOURITES: 'nv_favourites',
  HISTORY:    'nv_history',
  STATS:      'nv_stats',
  THEME:      'nv_theme',
};

// ── Theme ─────────────────────────────────────────────────────────────────────
export function getTheme()       { return localStorage.getItem(KEYS.THEME) || 'dark'; }
export function setTheme(t)      { localStorage.setItem(KEYS.THEME, t); }

// ── Favourites ────────────────────────────────────────────────────────────────
export function getFavourites()  { return JSON.parse(localStorage.getItem(KEYS.FAVOURITES) || '[]'); }
export function isFavourite(id)  { return getFavourites().some(f => f.id === id); }
export function toggleFavourite(place) {
  const favs = getFavourites();
  const idx  = favs.findIndex(f => f.id === place.id);
  if (idx >= 0) favs.splice(idx, 1); else favs.unshift({ ...place, savedAt: Date.now() });
  localStorage.setItem(KEYS.FAVOURITES, JSON.stringify(favs.slice(0, 50)));
  return idx < 0; // returns true if added
}

// ── History ───────────────────────────────────────────────────────────────────
export function getHistory()     { return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]'); }
export function addHistory(entry) {
  const h = getHistory();
  h.unshift({ ...entry, visitedAt: Date.now() });
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(h.slice(0, 30)));
}
export function clearHistory()   { localStorage.removeItem(KEYS.HISTORY); }

// ── Stats ─────────────────────────────────────────────────────────────────────
export function getStats() {
  return JSON.parse(localStorage.getItem(KEYS.STATS) || JSON.stringify({
    totalSearches: 0, moodCounts: {}, citiesVisited: [], placesViewed: 0, favouritesAdded: 0,
  }));
}
export function recordSearch(moodId, city) {
  const s = getStats();
  s.totalSearches++;
  s.moodCounts[moodId] = (s.moodCounts[moodId] || 0) + 1;
  if (city && !s.citiesVisited.includes(city)) s.citiesVisited.push(city);
  localStorage.setItem(KEYS.STATS, JSON.stringify(s));
}
export function recordPlaceView() {
  const s = getStats(); s.placesViewed++;
  localStorage.setItem(KEYS.STATS, JSON.stringify(s));
}
export function recordFavourite() {
  const s = getStats(); s.favouritesAdded++;
  localStorage.setItem(KEYS.STATS, JSON.stringify(s));
}

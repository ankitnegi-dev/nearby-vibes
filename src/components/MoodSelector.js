import React from 'react';
import{MOODS}from'../services/placesAPI';
import CitySearch from'./CitySearch';
import'./MoodSelector.css';
export default function MoodSelector({onSelect,radius,setRadius,theme,toggleTheme,onShowStats,onShowFavs,favCount,onCitySelect}){
  return(
    <div className={`mood-screen ${theme}`}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div className="mood-topbar">
        <div className="mood-topbar-left">
          <button className="icon-btn" onClick={onShowFavs} title="Favourites">⭐{favCount>0&&<span className="badge">{favCount}</span>}</button>
          <button className="icon-btn" onClick={onShowStats} title="Stats">📊</button>
        </div>
        <button className="icon-btn theme-btn" onClick={toggleTheme}>{theme==='dark'?'🌙':'☀️'}</button>
      </div>
      <h1 className="hero-title">Find your<br/>next spot.</h1>
      <p className="hero-sub">Pick a vibe — we'll find real places near you</p>
      <div className="radius-wrap">
        <div className="radius-row"><span>Search Radius</span><span className="radius-val">{(radius/1000).toFixed(1)} km</span></div>
        <input type="range" min={500} max={5000} step={250} value={radius} onChange={e=>setRadius(+e.target.value)}/>
      </div>
      <div className="mood-grid">
        {Object.entries(MOODS).filter(([id])=>id!=='newtown').map(([id,m])=>(
          <div key={id} className="mood-card" onClick={()=>onSelect(id)} style={{'--accent':m.color}}>
            <span className="mood-emoji">{m.emoji}</span>
            <div className="mood-title">{m.label}</div>
            <div className="mood-desc">{m.desc}</div>
            <span className="mood-pill">Explore →</span>
          </div>
        ))}
      </div>
      <div className="newtown-card" onClick={()=>onSelect('newtown')}>
        <div className="newtown-badge">NEW</div>
        <div className="newtown-left">
          <span className="newtown-emoji">🧭</span>
          <div>
            <div className="newtown-title">New in Town?</div>
            <div className="newtown-desc">Find hospitals, ATMs, grocery stores, transit & all city essentials in one go</div>
          </div>
        </div>
        <div className="newtown-features"><span>📋 Checklist</span><span>🔍 Search</span><span>🗺️ Map</span></div>
        <span className="newtown-arrow">→</span>
      </div>
      <CitySearch onSelectCity={onCitySelect} theme={theme}/>
    </div>
  );
}

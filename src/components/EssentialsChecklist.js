import React,{useState,useEffect} from 'react';
import{ESSENTIALS,fetchEssentialCategory}from'../services/placesAPI';
import{fmtDist}from'../utils/filters';
import'./EssentialsChecklist.css';
export default function EssentialsChecklist({userLat,userLon,onSelectPlace,theme}){
  const[data,setData]=useState({});
  const[checked,setChecked]=useState({});
  const[loading,setLoading]=useState({});
  useEffect(()=>{
    ESSENTIALS.forEach(async ess=>{
      setLoading(l=>({...l,[ess.key]:true}));
      const places=await fetchEssentialCategory(userLat,userLon,ess,3000);
      setData(d=>({...d,[ess.key]:places}));
      setLoading(l=>({...l,[ess.key]:false}));
    });
  },[userLat,userLon]);
  const toggle=key=>setChecked(c=>({...c,[key]:!c[key]}));
  const done=Object.values(checked).filter(Boolean).length;
  return(
    <div className={`checklist-wrap ${theme}`}>
      <div className="checklist-header">
        <div className="checklist-title">🧭 City Essentials</div>
        <div className="checklist-progress">
          <div className="progress-bar"><div className="progress-fill" style={{width:`${(done/ESSENTIALS.length)*100}%`}}/></div>
          <span className="progress-text">{done}/{ESSENTIALS.length} found</span>
        </div>
      </div>
      <div className="checklist-grid">
        {ESSENTIALS.map(ess=>{
          const places=data[ess.key]||[];
          const nearest=places[0];
          return(
            <div key={ess.key} className={`checklist-card ${checked[ess.key]?'checked':''}`} style={{'--ess-color':ess.color}}>
              <div className="card-top">
                <div className="ess-icon">{ess.emoji}</div>
                <div className="ess-info">
                  <div className="ess-label">{ess.label}</div>
                  {loading[ess.key]?<div className="ess-loading">Searching…</div>
                    :nearest?<div className="ess-nearest" onClick={()=>onSelectPlace(nearest)}>📍 {fmtDist(nearest.dist)} · <span>{nearest.name}</span></div>
                    :<div className="ess-none">None found nearby</div>}
                </div>
                <button className={`check-btn ${checked[ess.key]?'done':''}`} onClick={()=>toggle(ess.key)}>{checked[ess.key]?'✓':'○'}</button>
              </div>
              {places.length>1&&(
                <div className="more-places">
                  {places.slice(1).map(p=>(
                    <div key={p.id} className="mini-place" onClick={()=>onSelectPlace(p)}>
                      <span>{p.name}</span><span className="mini-dist">{fmtDist(p.dist)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {done===ESSENTIALS.length&&<div className="all-done">🎉 You've found all your city essentials!</div>}
    </div>
  );
}

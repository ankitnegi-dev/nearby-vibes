import React, { useState } from 'react';
import './SearchBar.css';
const SUGGESTIONS=['ATM','Hospital','Pharmacy','Police','Supermarket','Bus Stop','Metro','Post Office','Bakery','Cafe'];
export default function SearchBar({onSearch,loading,color='#00C2FF',theme}){
  const[query,setQuery]=useState('');
  const[focused,setFocused]=useState(false);
  const submit=e=>{e.preventDefault();if(query.trim())onSearch(query.trim());};
  const pick=s=>{setQuery(s);onSearch(s);};
  return(
    <div className={`searchbar-wrap ${theme}`}>
      <form onSubmit={submit} className="search-form">
        <span className="search-icon">🔍</span>
        <input className="search-input" type="text" placeholder='Search — "ATM", "Hospital", "Bus Stop"…'
          value={query} onChange={e=>setQuery(e.target.value)}
          onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),150)}/>
        {query&&<button type="button" className="clear-btn" onClick={()=>setQuery('')}>✕</button>}
        <button type="submit" className="search-btn" disabled={!query.trim()||loading} style={{background:color}}>{loading?'…':'Go'}</button>
      </form>
      {focused&&!query&&(
        <div className="suggestions">
          <div className="suggestions-label">Quick searches</div>
          <div className="suggestions-list">
            {SUGGESTIONS.map(s=><button key={s} className="suggestion-chip" style={{'--color':color}} onMouseDown={()=>pick(s)}>{s}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

export function haversine(lat1,lon1,lat2,lon2){const R=6371e3,toR=d=>d*Math.PI/180,dLat=toR(lat2-lat1),dLon=toR(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
export function fmtDist(m){return m<1000?Math.round(m)+' m':(m/1000).toFixed(1)+' km';}
export function fakeRating(id){return parseFloat((3.4+((id%30)/30)*1.6).toFixed(1));}
export function isOpenNow(){const h=new Date().getHours();return h>=7&&h<23;}
export function filterAndSort(places,sortBy,openOnly){return places.filter(p=>openOnly?p.open:true).sort((a,b)=>sortBy==='dist'?a.dist-b.dist:b.rating-a.rating);}
export function stars(r){const f=Math.floor(r),h=r-f>=0.5;return'★'.repeat(f)+(h?'½':'')+'☆'.repeat(5-f-(h?1:0));}
export function timeAgo(ts){const s=Math.floor((Date.now()-ts)/1000);if(s<60)return'just now';if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago';}

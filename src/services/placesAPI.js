import axios from 'axios';
import { haversine, fakeRating, isOpenNow } from '../utils/filters';

export const MOODS = {
  work:    { label:'Work Mode',   emoji:'💻', color:'#7C6AF7', queries:['amenity=cafe','amenity=library'],                                                 desc:'Cafés & Libraries' },
  date:    { label:'Date Night',  emoji:'🌹', color:'#F25882', queries:['amenity=restaurant','amenity=bar'],                                              desc:'Restaurants & Bars' },
  bite:    { label:'Quick Bite',  emoji:'⚡', color:'#F5A623', queries:['amenity=fast_food','amenity=food_court'],                                         desc:'Fast Food & Snacks' },
  budget:  { label:'Budget Hunt', emoji:'💸', color:'#2DC87A', queries:['amenity=cafe','amenity=fast_food','shop=bakery'],                                desc:'Cheap Eats & Bakeries' },
  newtown: { label:'New in Town', emoji:'🧭', color:'#00C2FF', queries:['amenity=hospital','amenity=pharmacy','amenity=police','shop=supermarket','amenity=bank','amenity=atm','amenity=bus_station','railway=station','amenity=post_office'], desc:'Essentials · Safety · Transit', isNewTown:true },
};

export const ESSENTIALS = [
  { key:'hospital',    label:'Hospital',      emoji:'🏥', color:'#FF6B6B', queries:['amenity=hospital'] },
  { key:'pharmacy',    label:'Pharmacy',      emoji:'💊', color:'#FF9F43', queries:['amenity=pharmacy'] },
  { key:'police',      label:'Police',        emoji:'🚔', color:'#5F6FFF', queries:['amenity=police'] },
  { key:'supermarket', label:'Grocery Store', emoji:'🛒', color:'#2DC87A', queries:['shop=supermarket','shop=grocery'] },
  { key:'atm',         label:'ATM / Bank',    emoji:'🏧', color:'#00C2FF', queries:['amenity=atm','amenity=bank'] },
  { key:'transit',     label:'Transit',       emoji:'🚌', color:'#A78BFA', queries:['amenity=bus_station','railway=station'] },
  { key:'post_office', label:'Post Office',   emoji:'📮', color:'#F59E0B', queries:['amenity=post_office'] },
  { key:'restaurant',  label:'Restaurant',    emoji:'🍽️', color:'#F25882', queries:['amenity=restaurant'] },
];

// Fallback mirror servers in case overpass-api.de rate limits or drops requests
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.khtml.disroot.org/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

/**
 * Execute Overpass query using POST request with mirror fallback
 */
async function postOverpassQuery(query) {
  let lastError = null;

  for (const serverUrl of OVERPASS_SERVERS) {
    try {
      const res = await axios.post(
        serverUrl,
        `data=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 sec timeout per mirror
        }
      );
      if (res.data && res.data.elements) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Overpass server [${serverUrl}] failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Overpass servers failed.');
}

function mapEl(e, lat, lon) {
  return {
    id: e.id,
    name: e.tags.name,
    nameLocal: e.tags['name:hi'] || e.tags['name:ta'] || e.tags['name:te'] || null,
    type: (e.tags.amenity || e.tags.shop || e.tags.railway || 'place').replace(/_/g, ' '),
    lat: e.lat,
    lon: e.lon,
    dist: haversine(lat, lon, e.lat, e.lon),
    rating: fakeRating(e.id),
    open: isOpenNow(),
    address: [e.tags['addr:housenumber'], e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(' ') || 'Nearby',
    phone: e.tags.phone || e.tags['contact:phone'] || null,
    website: e.tags.website || e.tags['contact:website'] || null
  };
}

export async function fetchPlaces(lat, lon, mood, radius = 1500) {
  const lines = mood.queries.map(q => {
    const [k, v] = q.split('=');
    return `node["${k}"="${v}"](around:${radius},${lat},${lon});`;
  }).join('\n');

  const query = `[out:json][timeout:15];\n(\n${lines}\n);\nout body 40;`;

  try {
    const data = await postOverpassQuery(query);
    return data.elements
      .filter(e => e.tags?.name)
      .map(e => mapEl(e, lat, lon))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 30);
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

export async function searchByKeyword(lat, lon, keyword, radius = 3000) {
  const query = `[out:json][timeout:15];\n(\n  node["name"~"${keyword}",i](around:${radius},${lat},${lon});\n  node["amenity"~"${keyword}",i](around:${radius},${lat},${lon});\n  node["shop"~"${keyword}",i](around:${radius},${lat},${lon});\n);\nout body 20;`;

  try {
    const data = await postOverpassQuery(query);
    return data.elements
      .filter(e => e.tags?.name)
      .map(e => mapEl(e, lat, lon))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 15);
  } catch (error) {
    console.error('Error searching by keyword:', error);
    return [];
  }
}

export async function fetchEssentialCategory(lat, lon, essential, radius = 3000) {
  const lines = essential.queries.map(q => {
    const [k, v] = q.split('=');
    return `node["${k}"="${v}"](around:${radius},${lat},${lon});`;
  }).join('\n');

  const query = `[out:json][timeout:10];\n(\n${lines}\n);\nout body 5;`;

  try {
    const data = await postOverpassQuery(query);
    return data.elements
      .filter(e => e.tags?.name)
      .map(e => ({
        id: e.id,
        name: e.tags.name,
        dist: haversine(lat, lon, e.lat, e.lon),
        lat: e.lat,
        lon: e.lon
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);
  } catch {
    return [];
  }
}

// ── City geocoding via Nominatim ──────────────────────────────────────────────
export async function geocodeCity(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=5`;
  const res = await axios.get(url, { headers: { 'Accept-Language': 'en' } });
  return res.data.map(r => ({
    displayName: r.display_name,
    shortName: r.name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    type: r.type
  }));
}

// ── Reverse geocode to get city name ─────────────────────────────────────────
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await axios.get(url, { headers: { 'Accept-Language': 'en' } });
    return res.data.address?.city || res.data.address?.town || res.data.address?.village || 'Unknown City';
  } catch {
    return 'Unknown City';
  }
}
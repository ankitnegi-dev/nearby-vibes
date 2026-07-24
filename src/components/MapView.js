import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

export default function MapView({
  places = [],
  userLat,
  userLon,
  mood,
  selected,
  onSelect,
  routeTo,
  theme,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const userMarkerRef = useRef(null);
  const markersRef = useRef([]);
  const routeRef = useRef(null);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([userLat, userLon], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [userLat, userLon]);

  // Update or Place "You Are Here" User Marker
  useEffect(() => {
    if (!mapInstance.current || userLat == null || userLon == null) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      html: `<div style="width:18px;height:18px;border-radius:50%;background:white;border:3px solid ${mood?.color || '#000'};box-shadow:0 0 0 5px ${mood?.color || '#000'}40"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: "",
    });

    userMarkerRef.current = L.marker([userLat, userLon], { icon: userIcon })
      .addTo(mapInstance.current)
      .bindPopup("<b>📍 You are here</b>");
  }, [userLat, userLon, mood?.color]);

  // Render Place Markers & Fit Bounds
  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = [[userLat, userLon]];

    places.forEach((p, i) => {
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${mood?.color || '#000'};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4)"><span style="transform:rotate(45deg);font-size:12px;font-weight:800;color:white">${i + 1}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: "",
      });

      const marker = L.marker([p.lat, p.lon], { icon }).addTo(mapInstance.current);
      marker.on("click", () => onSelect(p.id));
      markersRef.current.push(marker);
      bounds.push([p.lat, p.lon]);
    });

    if (bounds.length > 1) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [places, mood?.color, userLat, userLon, onSelect]);

  // Center/Pan to Selected Location
  useEffect(() => {
    if (selected && mapInstance.current) {
      mapInstance.current.panTo([selected.lat, selected.lon], {
        animate: true,
      });
    }
  }, [selected]);

  // Draw Route Line when routeTo is active
  useEffect(() => {
    if (!mapInstance.current) return;

    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }

    if (!routeTo) return;

    routeRef.current = L.polyline(
      [
        [userLat, userLon],
        [routeTo.lat, routeTo.lon],
      ],
      { color: mood?.color || '#000', weight: 3, dashArray: "8 6", opacity: 0.8 }
    ).addTo(mapInstance.current);

    mapInstance.current.fitBounds(
      [
        [userLat, userLon],
        [routeTo.lat, routeTo.lon],
      ],
      { padding: [40, 40] }
    );
  }, [routeTo, mood?.color, userLat, userLon]);

  return (
    <div
      ref={mapRef}
      className={`map-container ${theme === "light" ? "light-map" : ""}`}
    />
  );
}
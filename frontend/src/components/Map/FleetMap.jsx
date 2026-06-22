import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LegendRow from '../ui/LegendRow';

const STATUS_COLORS = {
  active: '#16a34a',
  idle: '#ca8a04',
  maintenance: '#ea580c',
  offline: '#dc2626',
};

export default function FleetMap({ vehicles, height = 'h-[500px]', onSelectVehicle }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (onSelectVehicle) window.openVehicleDetails = (id) => onSelectVehicle(id);
    return () => { delete window.openVehicleDetails; };
  }, [onSelectVehicle]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30, 0], zoom: 2, minZoom: 1.5,
      maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1.0,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains: 'abcd', maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const activeIds = new Set();

    vehicles.forEach((v) => {
      const { id, name, latitude, longitude, speed, fuel_level, engine_temp, status, region, assigned_route } = v;
      if (latitude == null || longitude == null || isNaN(latitude)) return;

      activeIds.add(id);
      const color = STATUS_COLORS[status] || '#6b7280';

      const popup = `
        <div style="padding:12px;font-family:inherit;min-width:200px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e5e7eb">
            <strong style="font-size:14px;color:#111">${name}</strong>
            <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;background:${color}18;color:${color};text-transform:capitalize">${status}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:#6b7280;margin-bottom:10px">
            <span>Region</span><span style="text-align:right;color:#111;font-weight:500">${region}</span>
            <span>Speed</span><span style="text-align:right;color:#111;font-family:monospace">${Math.round(speed)} km/h</span>
            <span>Fuel</span><span style="text-align:right;color:${fuel_level < 20 ? '#dc2626' : '#111'};font-family:monospace">${Math.round(fuel_level)}%</span>
            <span>Temp</span><span style="text-align:right;color:${engine_temp > 100 ? '#dc2626' : '#111'};font-family:monospace">${Math.round(engine_temp)}°C</span>
          </div>
          <p style="font-size:10px;color:#9ca3af;margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${assigned_route}</p>
          <button onclick="window.openVehicleDetails&&window.openVehicleDetails('${id}')"
            style="width:100%;padding:8px;background:#111;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">
            View details
          </button>
        </div>`;

      const icon = L.divIcon({
        html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center">
          <span style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></span>
        </div>`,
        className: '', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10],
      });

      if (markersRef.current[id]) {
        const m = markersRef.current[id];
        m.setLatLng([latitude, longitude]);
        m.setIcon(icon);
        m.setPopupContent(popup);
      } else {
        markersRef.current[id] = L.marker([latitude, longitude], { icon }).bindPopup(popup).addTo(map);
      }
    });

    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
    });
  }, [vehicles]);

  return (
    <div className={`relative ${height} w-full`}>
      <div className="map-legend">
        <LegendRow />
      </div>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}

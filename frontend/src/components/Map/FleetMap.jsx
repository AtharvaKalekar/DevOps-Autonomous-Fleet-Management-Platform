import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  active: '#10b981',      // Green
  idle: '#f59e0b',        // Yellow
  maintenance: '#f97316', // Orange
  offline: '#ef4444',     // Red
};

export default function FleetMap({ vehicles, height = 'h-[500px]' }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // Stores mapping of vehicleId -> Leaflet CircleMarker

  // Initialize Map (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Start centered at (30, 0) with zoom level 2
    const map = L.map(mapContainerRef.current, {
      center: [30, 0],
      zoom: 2,
      minZoom: 1.5,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0,
      zoomControl: true,
    });

    // Light Positron tile layer
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when vehicles data changes
  useEffect(() => {
    if (!mapRef.current) return;

    const currentMap = mapRef.current;
    const activeVehicleIds = new Set();

    vehicles.forEach((vehicle) => {
      const { id, name, latitude, longitude, speed, fuel_level, engine_temp, status, region, assigned_route } = vehicle;
      
      // If latitude and longitude are missing or null, don't show on map
      if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) return;

      activeVehicleIds.add(id);

      const color = STATUS_COLORS[status] || '#64748b';

      // HTML template for the popup
      const popupHtml = `
        <div class="p-2 space-y-2 select-none min-w-[200px]">
          <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
            <span class="font-extrabold text-slate-800 text-sm">${name}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}30">
              ${status}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs">
            <span class="text-slate-400 font-medium">Region:</span>
            <span class="text-slate-700 font-bold text-right">${region}</span>
            
            <span class="text-slate-400 font-medium">Speed:</span>
            <span class="text-slate-700 font-bold text-right">${speed} km/h</span>
            
            <span class="text-slate-400 font-medium">Fuel Level:</span>
            <span class="text-slate-700 font-bold text-right" style="color: ${fuel_level < 20 ? '#ef4444' : '#1e293b'}">${fuel_level}%</span>
            
            <span class="text-slate-400 font-medium">Engine Temp:</span>
            <span class="text-slate-700 font-bold text-right" style="color: ${engine_temp > 100 ? '#ef4444' : '#1e293b'}">${engine_temp}°C</span>
          </div>
          <div class="border-t border-slate-200 pt-1.5 mt-1.5 text-[10px] text-slate-400 font-semibold truncate">
            Route: ${assigned_route}
          </div>
        </div>
      `;

      if (markersRef.current[id]) {
        // Marker exists: update position, color and popup content
        const marker = markersRef.current[id];
        marker.setLatLng([latitude, longitude]);
        marker.setStyle({
          color: color,
          fillColor: color,
        });
        marker.setPopupContent(popupHtml);
      } else {
        // Marker doesn't exist: create it
        const marker = L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.6,
        });

        marker.bindPopup(popupHtml);
        marker.addTo(currentMap);
        markersRef.current[id] = marker;
      }
    });

    // Remove any markers for vehicles that are no longer in the list
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeVehicleIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [vehicles]);

  return (
    <div className={`relative border border-panelBorder rounded-2xl overflow-hidden shadow-sm ${height} w-full`}>
      <div className="absolute top-4 left-12 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-panelBorder shadow-sm">
        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Live Map Legend</h4>
        <div className="flex flex-col space-y-1.5 text-[10px] text-slate-500 font-semibold">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span>Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            <span>Idle</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#f97316]" />
            <span>Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            <span>Offline</span>
          </div>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  active: '#10b981',      // Green
  idle: '#f59e0b',        // Yellow
  maintenance: '#f97316', // Orange
  offline: '#ef4444',     // Red
};

export default function FleetMap({ vehicles, height = 'h-[500px]', onSelectVehicle }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // Stores mapping of vehicleId -> Leaflet Marker

  // Bind the global vehicle details click handler to window
  useEffect(() => {
    if (onSelectVehicle) {
      window.openVehicleDetails = (id) => {
        onSelectVehicle(id);
      };
    }
    return () => {
      delete window.openVehicleDetails;
    };
  }, [onSelectVehicle]);

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

    // Dark Matter tile layer
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
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
        <div class="p-2.5 space-y-2 select-none min-w-[210px] font-sans">
          <div class="flex items-center justify-between border-b border-panelBorder/30 pb-2 mb-2">
            <span class="font-black text-textPrimary text-sm tracking-tight">${name}</span>
            <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono" style="background-color: ${color}18; color: ${color}; border: 1px solid ${color}35">
              ${status}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
            <span class="text-textSecondary font-semibold">Region:</span>
            <span class="text-textPrimary font-extrabold text-right">${region}</span>
            
            <span class="text-textSecondary font-semibold">Velocity:</span>
            <span class="text-textPrimary font-bold text-right font-mono">${Math.round(speed)} km/h</span>
            
            <span class="text-textSecondary font-semibold">Fuel Level:</span>
            <span class="text-right font-mono font-bold" style="color: ${fuel_level < 20 ? '#ef4444' : 'var(--text-primary)'}">${Math.round(fuel_level)}%</span>
            
            <span class="text-textSecondary font-semibold">Engine Temp:</span>
            <span class="text-right font-mono font-bold" style="color: ${engine_temp > 100 ? '#ef4444' : 'var(--text-primary)'}">${Math.round(engine_temp)}°C</span>
          </div>
          <div class="border-t border-panelBorder/30 pt-2 mt-2 text-[9px] text-textSecondary font-semibold truncate">
            Route: ${assigned_route}
          </div>
          <button onclick="window.openVehicleDetails && window.openVehicleDetails('${id}')" class="w-full mt-2 bg-accentBlue hover:bg-accentHover text-white text-[10px] font-extrabold py-1.5 px-2 rounded-lg transition-all duration-150 shadow-sm uppercase tracking-wider block text-center">
            Open Control Panel
          </button>
        </div>
      `;

      // Create glowing HTML divIcon
      const markerHtml = `
        <div class="relative flex items-center justify-center w-6 h-6">
          ${status === 'active' ? `
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style="background-color: ${color}"></span>
          ` : ''}
          <span class="absolute inline-flex h-4.5 w-4.5 rounded-full opacity-40 blur-[2px]" style="background-color: ${color}; transform: scale(1.6);"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 border border-slate-900 shadow-md" style="background-color: ${color}"></span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker-wrapper',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -8],
      });

      if (markersRef.current[id]) {
        // Marker exists: update position, icon and popup content
        const marker = markersRef.current[id];
        marker.setLatLng([latitude, longitude]);
        marker.setIcon(customIcon);
        marker.setPopupContent(popupHtml);
      } else {
        // Marker doesn't exist: create it
        const marker = L.marker([latitude, longitude], {
          icon: customIcon,
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
    <div className={`relative border border-panelBorder rounded-2xl overflow-hidden shadow-sm ${height} w-full transition-all duration-300`}>
      <div className="absolute top-4 left-12 z-[1000] glass-panel px-3 py-2.5 rounded-xl border border-panelBorder shadow-md">
        <h4 className="text-[9px] font-extrabold text-textPrimary uppercase tracking-widest mb-2">Live Map Legend</h4>
        <div className="flex flex-col space-y-1.5 text-[10px] text-textSecondary font-bold">
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

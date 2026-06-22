import React, { useState } from 'react';
import { Search, X, Eye, Fuel, Activity, Thermometer } from 'lucide-react';
import StatusPill from '../components/ui/StatusPill';

function VehicleInitials({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="vehicle-avatar">{initials}</div>;
}

export default function Vehicles({ vehicles, onSelectVehicle }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)) &&
      (!statusFilter || v.status === statusFilter) &&
      (!regionFilter || v.region === regionFilter) &&
      (!typeFilter || v.type === typeFilter)
    );
  });

  return (
    <div className="space-y-4">
      <div className="squire-card squire-card-static p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted pointer-events-none" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input w-full pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ui-select">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="ui-select">
            <option value="">All regions</option>
            <option value="Asia">Asia</option>
            <option value="Europe">Europe</option>
            <option value="North America">North America</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="ui-select">
            <option value="">All types</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="autonomous">Autonomous</option>
          </select>
        </div>
        <span className="text-xs text-textMuted font-medium md:ml-auto tabular-nums">
          {filtered.length} of {vehicles.length}
        </span>
      </div>

      <div className="squire-card squire-card-static overflow-hidden">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Region</th>
                <th>Status</th>
                <th>Speed</th>
                <th>Fuel</th>
                <th>Temp</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state py-12">
                      <p className="text-sm font-medium text-textPrimary">No vehicles found</p>
                      <p className="text-xs text-textMuted">Try adjusting your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <VehicleInitials name={v.name} />
                        <div>
                          <div className="font-semibold text-textPrimary">{v.name}</div>
                          <div className="text-[11px] text-textMuted font-mono truncate max-w-[140px]">{v.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{v.type}</td>
                    <td>{v.region}</td>
                    <td><StatusPill status={v.status} /></td>
                    <td>
                      <span className="flex items-center gap-1.5 font-mono tabular-nums text-textPrimary">
                        <Activity className="h-3.5 w-3.5 text-accentBlue" />
                        {Math.round(v.speed)}
                        <span className="text-textMuted text-[11px]">km/h</span>
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 w-32">
                        <div className="progress-track flex-1">
                          <div
                            className={`h-full rounded-full transition-all ${v.fuel_level < 20 ? 'bg-red-500' : v.fuel_level < 50 ? 'bg-yellow-400' : 'bg-green-500'}`}
                            style={{ width: `${v.fuel_level}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-textMuted tabular-nums w-8">{Math.round(v.fuel_level)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`font-mono tabular-nums flex items-center gap-1 ${v.engine_temp > 100 ? 'text-red-500 font-bold' : 'text-textPrimary'}`}>
                        <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                        {Math.round(v.engine_temp)}°
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => onSelectVehicle(v.id)} className="btn-primary text-xs py-1.5 px-3">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

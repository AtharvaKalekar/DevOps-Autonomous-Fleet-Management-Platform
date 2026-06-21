import React, { useState } from 'react';
import { Search, X, Eye, Fuel, Activity, Thermometer } from 'lucide-react';

const STATUS_PILLS = {
  active: 'bg-green-500/10 border-green-500/20 text-green-400',
  idle: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  maintenance: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  offline: 'bg-red-500/10 border-red-500/20 text-red-400',
};

export default function Vehicles({ vehicles, onSelectVehicle }) {
  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Apply search & filters
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || v.status === statusFilter;
    const matchesRegion = regionFilter === '' || v.region === regionFilter;
    const matchesType = typeFilter === '' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesRegion && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-textPrimary tracking-wide uppercase">
            Vehicles Inventory
          </h1>
          <p className="text-xs text-textSecondary font-semibold">
            Manage operational statuses, coordinate route plans, and run diagnostic audits on active units
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-textSecondary" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-panelBg border border-panelBorder text-textPrimary text-xs pl-10 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-accentBlue/50 transition-all placeholder:text-textSecondary/50 font-semibold"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3.5 text-textSecondary hover:text-textPrimary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-panelBg border border-panelBorder text-textPrimary text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-accentBlue/50 font-bold"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-panelBg border border-panelBorder text-textPrimary text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-accentBlue/50 font-bold"
          >
            <option value="">All Regions</option>
            <option value="Asia">Asia</option>
            <option value="Europe">Europe</option>
            <option value="North America">North America</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-panelBg border border-panelBorder text-textPrimary text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-accentBlue/50 font-bold"
          >
            <option value="">All Types</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="autonomous">Autonomous</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-panelBorder bg-panelBg/20 text-[10px] font-extrabold uppercase tracking-widest text-textSecondary">
                <th className="py-4.5 px-6">Name / ID</th>
                <th className="py-4.5 px-5">Type</th>
                <th className="py-4.5 px-5">Region</th>
                <th className="py-4.5 px-5">Status</th>
                <th className="py-4.5 px-5">Speed</th>
                <th className="py-4.5 px-5">Fuel Level</th>
                <th className="py-4.5 px-5">Engine Temp</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder/30 text-xs text-textSecondary font-semibold">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-textSecondary font-bold">
                    No vehicles match the active filters
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const statusClass = STATUS_PILLS[vehicle.status] || 'bg-panelBg border-panelBorder text-textSecondary';
                  
                  return (
                    <tr key={vehicle.id} className="hover:bg-panelBg/20 transition-colors">
                      {/* Name / ID */}
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-textPrimary mb-0.5">{vehicle.name}</div>
                        <div className="text-[9px] text-textSecondary font-mono max-w-[150px] truncate">{vehicle.id}</div>
                      </td>
                      {/* Type */}
                      <td className="py-4 px-5 capitalize font-bold text-textPrimary/80">{vehicle.type}</td>
                      {/* Region */}
                      <td className="py-4 px-5 text-textSecondary font-medium">{vehicle.region}</td>
                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${statusClass}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      {/* Speed */}
                      <td className="py-4 px-5 font-mono font-bold text-textPrimary/90 flex items-center h-14">
                        <Activity className="h-3.5 w-3.5 mr-1.5 text-blue-500/70" />
                        <span>{Math.round(vehicle.speed)} km/h</span>
                      </td>
                      {/* Fuel level (progress bar) */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2 w-28">
                          <div className="flex-1 bg-panelBorder h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                vehicle.fuel_level < 20 ? 'bg-red-500 animate-pulse' :
                                vehicle.fuel_level < 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${vehicle.fuel_level}%` }}
                            />
                          </div>
                          <span className={`font-mono text-[9px] font-bold flex items-center ${vehicle.fuel_level < 20 ? 'text-red-500' : 'text-textSecondary'}`}>
                            <Fuel className="h-3 w-3 mr-0.5" />
                            {Math.round(vehicle.fuel_level)}%
                          </span>
                        </div>
                      </td>
                      {/* Engine Temp */}
                      <td className="py-4 px-5">
                        <span className={`font-mono font-bold flex items-center ${vehicle.engine_temp > 100 ? 'text-red-500 font-extrabold' : 'text-textPrimary/90'}`}>
                          <Thermometer className="h-3.5 w-3.5 mr-1 text-orange-500/70" />
                          {Math.round(vehicle.engine_temp)}°C
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onSelectVehicle(vehicle.id)}
                          className="bg-accentBlue/10 hover:bg-accentBlue border border-accentBlue/20 text-accentBlue hover:text-white font-black px-3.5 py-2 rounded-xl flex items-center space-x-1.5 ml-auto transition-all duration-150 shadow-sm text-[10px] uppercase tracking-wider"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Diagnostics</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

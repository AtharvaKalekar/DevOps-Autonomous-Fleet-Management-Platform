import React, { useState, useEffect } from 'react';
import { Search, X, Loader, Gauge, Edit, MapPin, Route, Settings, Eye, Activity, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import VehicleHealthPanel from '../components/Panels/VehicleHealthPanel';
import toast from 'react-hot-toast';

const STATUS_PILLS = {
  active: 'bg-green-50 border-green-200 text-green-700',
  idle: 'bg-amber-50 border-amber-200 text-amber-700',
  maintenance: 'bg-orange-50 border-orange-200 text-orange-700',
  offline: 'bg-red-50 border-red-200 text-red-700',
};

export default function Vehicles({ vehicles, setVehicles }) {
  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Drawer States
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [drawerTab, setDrawerTab] = useState('diagnostics'); // 'diagnostics' | 'trends'

  // Apply search & filters
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || v.status === statusFilter;
    const matchesRegion = regionFilter === '' || v.region === regionFilter;
    const matchesType = typeFilter === '' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesRegion && matchesType;
  });

  // Open Drawer and Load History
  const handleOpenDrawer = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDrawerOpen(true);
    setLoadingHistory(true);
    setDrawerTab('diagnostics');
    setTelemetryHistory([]);

    try {
      const res = await api.getTelemetryHistory(vehicle.id);
      if (res.success) {
        // Take last 20 readings for analytics
        const last20 = res.data.slice(-20);
        setTelemetryHistory(last20);
      }
    } catch (err) {
      console.error('Failed to load telemetry history:', err);
      toast.error('Failed to load telemetry logs.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Close Drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedVehicle(null);
    setTelemetryHistory([]);
  };

  // Update real-time chart points if the currently selected vehicle gets updates via WebSockets
  useEffect(() => {
    if (!selectedVehicle || !isDrawerOpen) return;

    const currentVehicleData = vehicles.find((v) => v.id === selectedVehicle.id);
    if (!currentVehicleData) return;

    // Update selected vehicle reference with live websocket stats
    setSelectedVehicle(currentVehicleData);

    // Append new live point to telemetry history if the timestamp is newer
    if (telemetryHistory.length > 0) {
      const lastPoint = telemetryHistory[telemetryHistory.length - 1];
      const wsTimestamp = currentVehicleData.last_telemetry_time;

      if (wsTimestamp && new Date(wsTimestamp).getTime() > new Date(lastPoint.timestamp).getTime()) {
        const newPoint = {
          timestamp: wsTimestamp,
          speed: currentVehicleData.speed,
          fuel_level: currentVehicleData.fuel_level,
          engine_temp: currentVehicleData.engine_temp,
          battery_voltage: currentVehicleData.battery_voltage,
        };
        setTelemetryHistory((prev) => [...prev.slice(1), newPoint]); // Keep slide buffer of last 20
      }
    }
  }, [vehicles, selectedVehicle?.id, isDrawerOpen]);

  // Update Status Handler
  const handleStatusChange = async (newStatus) => {
    if (!selectedVehicle) return;
    setUpdatingStatus(true);
    try {
      const res = await api.updateVehicleStatus(selectedVehicle.id, newStatus);
      if (res.success) {
        // Update local vehicles state
        setVehicles((prev) =>
          prev.map((v) => (v.id === selectedVehicle.id ? { ...v, status: newStatus } : v))
        );
        setSelectedVehicle((prev) => ({ ...prev, status: newStatus }));
        toast.success(`Vehicle status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update vehicle status:', err);
      toast.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatChartTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide uppercase">
            Vehicles Inventory
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage status, route assignments, and run diagnostics on your fleet
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-panelBorder p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-panelBorder text-slate-700 text-sm pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-slate-300 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-panelBorder text-slate-600 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-slate-300 font-bold"
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
            className="bg-slate-50 border border-panelBorder text-slate-600 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-slate-300 font-bold"
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
            className="bg-slate-50 border border-panelBorder text-slate-600 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-slate-300 font-bold"
          >
            <option value="">All Types</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="autonomous">Autonomous</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white border border-panelBorder rounded-2xl overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-panelBorder bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">Name / ID</th>
                <th className="py-4 px-4">Type</th>
                <th className="py-4 px-4">Region</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Speed</th>
                <th className="py-4 px-4">Fuel Level</th>
                <th className="py-4 px-4">Engine Temp</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-bold">
                    No vehicles match the active filters
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const statusClass = STATUS_PILLS[vehicle.status] || 'bg-slate-100 border-slate-200 text-slate-500';
                  
                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name / ID */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-800 mb-0.5">{vehicle.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono max-w-[150px] truncate">{vehicle.id}</div>
                      </td>
                      {/* Type */}
                      <td className="py-4 px-4 capitalize font-semibold text-slate-700">{vehicle.type}</td>
                      {/* Region */}
                      <td className="py-4 px-4 text-slate-500 font-medium">{vehicle.region}</td>
                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusClass}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      {/* Speed */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-800">{vehicle.speed} km/h</td>
                      {/* Fuel level (progress bar) */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 w-28">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                vehicle.fuel_level < 20 ? 'bg-red-500' :
                                vehicle.fuel_level < 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${vehicle.fuel_level}%` }}
                            />
                          </div>
                          <span className={`font-mono text-[10px] font-bold ${vehicle.fuel_level < 20 ? 'text-red-600' : 'text-slate-500'}`}>
                            {Math.round(vehicle.fuel_level)}%
                          </span>
                        </div>
                      </td>
                      {/* Engine Temp */}
                      <td className="py-4 px-4">
                        <span className={`font-mono font-bold ${vehicle.engine_temp > 100 ? 'text-red-600 font-extrabold' : 'text-slate-700'}`}>
                          {vehicle.engine_temp}°C
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleOpenDrawer(vehicle)}
                          className="bg-accentBlue/10 hover:bg-accentBlue text-accentBlue hover:text-white border border-accentBlue/20 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 ml-auto transition-all duration-150 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
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

      {/* Real-time Diagnostics Side Drawer */}
      {isDrawerOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs"
            onClick={handleCloseDrawer}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xl bg-white border-l border-panelBorder h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-panelBorder flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                  <Gauge className="h-5 w-5 text-accentBlue" />
                  <span>Telemetry Analytics: {selectedVehicle.name}</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-mono block mt-1 font-semibold">
                  DEVICE UUID: {selectedVehicle.id}
                </span>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="text-slate-400 hover:text-slate-800 p-2 border border-panelBorder rounded-xl hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-panelBorder bg-slate-50/50">
              <button
                onClick={() => setDrawerTab('diagnostics')}
                className={`flex-1 py-3.5 text-xs font-extrabold uppercase border-b-2 transition-all flex items-center justify-center space-x-2 ${
                  drawerTab === 'diagnostics'
                    ? 'border-accentBlue text-accentBlue bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Diagnostics & Control</span>
              </button>
              <button
                onClick={() => setDrawerTab('trends')}
                className={`flex-1 py-3.5 text-xs font-extrabold uppercase border-b-2 transition-all flex items-center justify-center space-x-2 ${
                  drawerTab === 'trends'
                    ? 'border-accentBlue text-accentBlue bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Historical Trends</span>
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {drawerTab === 'diagnostics' ? (
                // Diagnostics Tab
                <div className="space-y-6">
                  {/* Meta details cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-panelBorder p-3 rounded-xl flex items-center space-x-3 shadow-xs">
                      <MapPin className="text-slate-400 h-5 w-5" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Region</span>
                        <span className="text-xs text-slate-700 font-extrabold">{selectedVehicle.region}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-panelBorder p-3 rounded-xl flex items-center space-x-3 shadow-xs">
                      <Route className="text-slate-400 h-5 w-5" />
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Route</span>
                        <span className="text-xs text-slate-700 font-extrabold truncate block">
                          {selectedVehicle.assigned_route}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Update Control */}
                  <div className="bg-white border border-panelBorder p-4 rounded-2xl space-y-3 shadow-xs">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-slate-400" />
                      <span>Update Operational Status</span>
                    </label>
                    <div className="flex gap-2">
                      {['active', 'idle', 'maintenance', 'offline'].map((status) => {
                        const isActive = selectedVehicle.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={updatingStatus}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-extrabold uppercase border capitalize transition-all duration-150 ${
                              isActive
                                ? STATUS_PILLS[status]
                                : 'bg-slate-50 border-panelBorder text-slate-400 hover:text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Diagnostics Gauges */}
                  <VehicleHealthPanel vehicle={selectedVehicle} />
                </div>
              ) : (
                // Historical Trends Tab
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Performance Area Graphs
                    </h4>

                    {loadingHistory ? (
                      <div className="h-48 border border-panelBorder bg-white rounded-2xl flex items-center justify-center shadow-xs">
                        <Loader className="h-6 w-6 text-accentBlue animate-spin" />
                      </div>
                    ) : telemetryHistory.length === 0 ? (
                      <div className="h-48 border border-panelBorder bg-white rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold shadow-xs">
                        No historical telemetry logs captured yet.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Speed Area Chart */}
                        <div className="bg-white border border-panelBorder p-4 rounded-2xl shadow-xs">
                          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Speed (km/h)
                          </h5>
                          <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={telemetryHistory}>
                                <defs>
                                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                  dataKey="timestamp"
                                  tickFormatter={formatChartTime}
                                  stroke="#94a3b8"
                                  fontSize={9}
                                />
                                <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 130]} />
                                <Tooltip
                                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                  labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                                  itemStyle={{ color: '#2563eb' }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="speed"
                                  stroke="#2563eb"
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill="url(#colorSpeed)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Fuel Area Chart */}
                        <div className="bg-white border border-panelBorder p-4 rounded-2xl shadow-xs">
                          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Fuel Level Trends (%)
                          </h5>
                          <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={telemetryHistory}>
                                <defs>
                                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                  dataKey="timestamp"
                                  tickFormatter={formatChartTime}
                                  stroke="#94a3b8"
                                  fontSize={9}
                                />
                                <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                                <Tooltip
                                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                  labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                                  itemStyle={{ color: '#10b981' }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="fuel_level"
                                  stroke="#10b981"
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill="url(#colorFuel)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Recent History Table log */}
                        <div className="bg-white border border-panelBorder rounded-2xl shadow-xs overflow-hidden">
                          <div className="px-4 py-3 border-b border-panelBorder bg-slate-50">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Recent Telemetry Logs (Raw Data)
                            </h5>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[10px]">
                              <thead>
                                <tr className="border-b border-panelBorder text-slate-400 font-bold uppercase bg-slate-50/50">
                                  <th className="py-2 px-3">Time</th>
                                  <th className="py-2 px-2">Speed</th>
                                  <th className="py-2 px-2">Fuel</th>
                                  <th className="py-2 px-2">Temp</th>
                                  <th className="py-2 px-2">Volt</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                {telemetryHistory.slice().reverse().map((log, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3 text-slate-400 font-mono">
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="py-2 px-2 font-bold text-slate-700">{Math.round(log.speed)} km/h</td>
                                    <td className="py-2 px-2">{Math.round(log.fuel_level)}%</td>
                                    <td className="py-2 px-2" style={{ color: log.engine_temp > 100 ? '#ef4444' : 'inherit' }}>
                                      {Math.round(log.engine_temp)}°C
                                    </td>
                                    <td className="py-2 px-2">{parseFloat(log.battery_voltage).toFixed(1)}V</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

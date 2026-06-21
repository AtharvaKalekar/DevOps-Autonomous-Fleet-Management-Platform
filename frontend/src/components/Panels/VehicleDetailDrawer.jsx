import React, { useState, useEffect } from 'react';
import { X, Truck, Navigation, Battery, Droplet, Thermometer, ShieldAlert, Activity, Check } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'bg-green-500/10 border-green-500/20 text-green-400',
  idle: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  maintenance: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  offline: 'bg-red-500/10 border-red-500/20 text-red-400',
};

const SEVERITY_COLORS = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export default function VehicleDetailDrawer({ vehicleId, vehicles, alerts, setAlerts, onClose }) {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  // Load telemetry history
  useEffect(() => {
    if (!vehicleId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getTelemetryHistory(vehicleId);
        if (res.success) {
          // Recharts expects oldest first
          const sorted = [...res.data].reverse();
          setHistory(sorted.slice(-20)); // Last 20 ticks
        }
      } catch (err) {
        console.error('Failed to load telemetry history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [vehicleId]);

  if (!vehicleId || !vehicle) return null;

  // Filter alerts for this vehicle
  const vehicleAlerts = alerts.filter(a => a.vehicle_id === vehicle.id);

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      const res = await api.resolveAlert(alertId);
      if (res.success) {
        toast.success('Alert resolved.');
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve alert.');
    } finally {
      setResolvingId(null);
    }
  };

  // Chart custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-2.5 rounded-lg border border-panelBorder text-[10px] space-y-1">
          <p className="font-mono text-textSecondary">{new Date(payload[0].payload.timestamp).toLocaleTimeString()}</p>
          <p className="text-blue-400 font-extrabold">Speed: <span className="font-mono">{payload[0].value} km/h</span></p>
          <p className="text-green-400 font-extrabold">Fuel: <span className="font-mono">{payload[1]?.value}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 sm:w-[420px] max-w-full glass-panel border-l border-panelBorder flex flex-col shadow-2xl transition-transform duration-300 transform translate-x-0 animate-slide-in">
      {/* Drawer Header */}
      <div className="p-5 border-b border-panelBorder/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-accentBlue/10 text-accentBlue border border-accentBlue/20">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-textPrimary text-base leading-tight">{vehicle.name}</h3>
            <span className="text-[10px] text-textSecondary font-mono block mt-0.5">{vehicle.id}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-panelBorder/20 text-textSecondary hover:text-textPrimary transition-all"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Drawer Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Status and Region Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-3 rounded-xl border border-panelBorder/20 flex flex-col justify-between h-18">
            <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-widest">Operating Status</span>
            <span className={`inline-flex self-start items-center px-2 py-0.5 mt-1 rounded-lg text-[10px] font-extrabold uppercase border ${STATUS_COLORS[vehicle.status]}`}>
              {vehicle.status}
            </span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-panelBorder/20 flex flex-col justify-between h-18">
            <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-widest">Assigned Region</span>
            <span className="text-textPrimary text-xs font-black mt-1 font-mono tracking-wider">{vehicle.region}</span>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-extrabold text-textSecondary uppercase tracking-widest">Live Telemetry Metrics</h4>
          <div className="grid grid-cols-2 gap-3.5">
            {/* Speed */}
            <div className="glass-panel p-3.5 rounded-xl border border-panelBorder/20 flex items-center space-x-3.5 shadow-sm">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-wider block">Velocity</span>
                <span className="text-textPrimary font-mono font-black text-sm">{Math.round(vehicle.speed)} km/h</span>
              </div>
            </div>
            {/* Fuel */}
            <div className="glass-panel p-3.5 rounded-xl border border-panelBorder/20 flex items-center space-x-3.5 shadow-sm">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                <Droplet className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-wider block">Fuel Level</span>
                <span className="text-textPrimary font-mono font-black text-sm">{Math.round(vehicle.fuel_level)}%</span>
              </div>
            </div>
            {/* Temp */}
            <div className="glass-panel p-3.5 rounded-xl border border-panelBorder/20 flex items-center space-x-3.5 shadow-sm">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-wider block">Engine Temp</span>
                <span className="text-textPrimary font-mono font-black text-sm">{Math.round(vehicle.engine_temp)}°C</span>
              </div>
            </div>
            {/* Battery */}
            <div className="glass-panel p-3.5 rounded-xl border border-panelBorder/20 flex items-center space-x-3.5 shadow-sm">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Battery className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-wider block">Battery</span>
                <span className="text-textPrimary font-mono font-black text-sm">{vehicle.battery_voltage?.toFixed(1) || '12.6'} V</span>
              </div>
            </div>
          </div>
        </div>

        {/* GPS Coordinates & Route */}
        <div className="glass-panel p-4 rounded-xl border border-panelBorder/20 space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs border-b border-panelBorder/30 pb-2">
            <span className="text-textSecondary font-bold flex items-center"><Navigation className="h-3.5 w-3.5 mr-1 text-accentBlue" /> Coordinates</span>
            <span className="font-mono font-bold text-textPrimary text-[10px]">
              {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
            </span>
          </div>
          <div className="text-xs pt-1">
            <span className="text-textSecondary font-bold block">Assigned Route Plan</span>
            <span className="text-textPrimary font-extrabold text-xs block mt-1">{vehicle.assigned_route}</span>
          </div>
        </div>

        {/* Telemetry Chart */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-extrabold text-textSecondary uppercase tracking-widest">Telemetry History (Speed & Fuel)</h4>
          <div className="glass-panel p-3 rounded-xl border border-panelBorder/20 h-48 flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-2 text-textSecondary">
                <Loader className="h-5 w-5 animate-spin text-accentBlue" />
                <span className="text-[9px] uppercase font-bold tracking-wider">Syncing timeline history...</span>
              </div>
            ) : history.length === 0 ? (
              <span className="text-xs text-textSecondary">No telemetry entries cached yet.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
                  <XAxis dataKey="timestamp" tick={false} stroke="rgba(148, 163, 184, 0.4)" />
                  <YAxis stroke="rgba(148, 163, 184, 0.4)" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" />
                  <Area type="monotone" dataKey="fuel_level" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorFuel)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Active Alerts for this vehicle */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-extrabold text-textSecondary uppercase tracking-widest">Active Vehicle Alerts ({vehicleAlerts.length})</h4>
          <div className="space-y-2">
            {vehicleAlerts.length === 0 ? (
              <div className="glass-panel p-4 rounded-xl border border-panelBorder/20 text-center text-xs text-textSecondary font-semibold">
                No active anomalies or warning flags.
              </div>
            ) : (
              vehicleAlerts.map(alert => (
                <div key={alert.id} className="glass-panel p-3 rounded-xl border border-panelBorder/20 flex items-center justify-between shadow-sm">
                  <div className="space-y-1 flex-1 pr-3">
                    <div className="flex items-center space-x-1.5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${SEVERITY_COLORS[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      {alert.occurrence_count > 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-mono font-bold animate-pulse">
                          ×{alert.occurrence_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-textPrimary">{alert.message}</p>
                    <span className="text-[9px] text-textSecondary font-mono block">{new Date(alert.updated_at || alert.created_at).toLocaleTimeString()}</span>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="p-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                    title="Resolve Alert"
                  >
                    {resolvingId === alert.id ? (
                      <span className="block h-3.5 w-3.5 border-2 border-t-transparent border-green-500 rounded-full animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

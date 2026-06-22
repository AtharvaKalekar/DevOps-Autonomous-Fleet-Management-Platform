import React, { useState, useEffect } from 'react';
import { X, Truck, Navigation, Battery, Droplet, Thermometer, Activity, Check, Loader } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusPill from '../ui/StatusPill';

const METRICS = [
  { key: 'speed', icon: Activity, label: 'Speed', fmt: (v) => `${Math.round(v.speed)} km/h`, color: '#2563eb' },
  { key: 'fuel', icon: Droplet, label: 'Fuel', fmt: (v) => `${Math.round(v.fuel_level)}%`, color: '#16a34a' },
  { key: 'temp', icon: Thermometer, label: 'Engine', fmt: (v) => `${Math.round(v.engine_temp)}°C`, color: '#ea580c' },
  { key: 'battery', icon: Battery, label: 'Battery', fmt: (v) => `${v.battery_voltage?.toFixed(1) || '12.6'} V`, color: '#ca8a04' },
];

export default function VehicleDetailDrawer({ vehicleId, vehicles, alerts, setAlerts, onClose }) {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;
    setLoading(true);
    api.getTelemetryHistory(vehicleId)
      .then(res => { if (res.success) setHistory([...res.data].reverse().slice(-20)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vehicleId]);

  if (!vehicleId || !vehicle) return null;

  const vehicleAlerts = alerts.filter(a => a.vehicle_id === vehicle.id);

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      const res = await api.resolveAlert(alertId);
      if (res.success) {
        toast.success('Alert resolved.');
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch {
      toast.error('Failed to resolve.');
    } finally {
      setResolvingId(null);
    }
  };

  const TooltipContent = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-panelBg p-2.5 rounded-xl border border-panelBorder shadow-card text-xs space-y-0.5">
        <p className="font-mono text-textMuted">{new Date(payload[0].payload.timestamp).toLocaleTimeString()}</p>
        <p className="font-semibold text-accentBlue">Speed: {payload[0].value} km/h</p>
        <p className="font-semibold text-green-600">Fuel: {payload[1]?.value}%</p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-panelBg border-l border-panelBorder flex flex-col animate-slide-in"
      style={{ boxShadow: 'var(--card-shadow-lg)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-panelBorder flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accentLight flex items-center justify-center flex-shrink-0">
            <Truck className="h-5 w-5 text-accentBlue" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-textPrimary truncate">{vehicle.name}</h3>
            <p className="text-[11px] text-textMuted font-mono truncate">{vehicle.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status row */}
        <div className="flex items-center gap-3">
          <StatusPill status={vehicle.status} />
          <span className="text-xs text-textMuted">·</span>
          <span className="text-xs font-semibold text-textSecondary">{vehicle.region}</span>
          <span className="text-xs text-textMuted capitalize ml-auto">{vehicle.type}</span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {METRICS.map(({ icon: Icon, label, fmt, color }) => (
            <div key={label} className="rounded-xl border border-panelBorder p-3.5 bg-surfaceMuted/50">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                <span className="text-[11px] font-medium text-textMuted">{label}</span>
              </div>
              <p className="text-lg font-bold font-mono text-textPrimary tabular-nums">{fmt(vehicle)}</p>
            </div>
          ))}
        </div>

        {/* Location */}
        <div className="rounded-xl border border-panelBorder p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-textMuted flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-accentBlue" /> GPS
            </span>
            <span className="font-mono text-[11px] text-textPrimary tabular-nums">
              {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
            </span>
          </div>
          <div className="border-t border-panelBorder pt-2">
            <p className="text-[11px] text-textMuted">Route</p>
            <p className="text-sm font-semibold text-textPrimary mt-0.5">{vehicle.assigned_route}</p>
          </div>
        </div>

        {/* Chart */}
        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-3">Telemetry</p>
          <div className="rounded-xl border border-panelBorder p-2 h-44 flex items-center justify-center bg-surfaceMuted/30">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader className="h-5 w-5 animate-spin text-accentBlue" />
                <span className="text-xs text-textMuted">Loading...</span>
              </div>
            ) : history.length === 0 ? (
              <span className="text-xs text-textMuted">No data yet</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ful" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" />
                  <XAxis dataKey="timestamp" tick={false} stroke="transparent" />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip content={<TooltipContent />} />
                  <Area type="monotone" dataKey="speed" stroke="#2563eb" strokeWidth={2} fill="url(#spd)" dot={false} />
                  <Area type="monotone" dataKey="fuel_level" stroke="#16a34a" strokeWidth={2} fill="url(#ful)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-3">
            Alerts ({vehicleAlerts.length})
          </p>
          {vehicleAlerts.length === 0 ? (
            <div className="rounded-xl border border-panelBorder p-4 text-center text-xs text-textMuted">
              No active alerts for this vehicle.
            </div>
          ) : (
            <div className="space-y-2">
              {vehicleAlerts.map(alert => (
                <div key={alert.id} className="rounded-xl border border-panelBorder p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <StatusPill status={alert.severity} />
                    <p className="text-xs font-medium text-textPrimary leading-relaxed">{alert.message}</p>
                    <p className="text-[10px] text-textMuted font-mono">
                      {new Date(alert.updated_at || alert.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="btn-ghost flex-shrink-0"
                  >
                    {resolvingId === alert.id ? (
                      <span className="block h-3.5 w-3.5 border-2 border-t-transparent border-accentBlue rounded-full animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

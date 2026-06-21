import React from 'react';
import { Fuel, Thermometer, Battery } from 'lucide-react';

// Circular Gauge Helper
function CircularGauge({ value, max, unit, label, icon: Icon, getColor, formatValue, getStatusText, getStatusColor }) {
  const radius = 38;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = getColor(value);
  const status = getStatusText(value);
  const statusColor = getStatusColor(value);

  return (
    <div className="bg-slate-50 border border-panelBorder rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 relative hover:border-slate-300 transition-colors shadow-sm w-full">
      {/* Icon top corner */}
      <div className="absolute top-3 left-3 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>

      {/* SVG Ring */}
      <div className="relative h-20 w-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Ring */}
          <circle
            className="text-slate-200"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
          {/* Animated Value Ring */}
          <circle
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Inner Label */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-base font-black text-slate-800 tracking-tight">
            {formatValue ? formatValue(value) : value}
          </span>
          <span className="text-[9px] text-slate-400 uppercase font-bold">{unit}</span>
        </div>
      </div>

      {/* Label and Subtext */}
      <div className="text-center space-y-0.5">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
          {label}
        </span>
        <span
          className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full inline-block"
          style={{ backgroundColor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

export default function VehicleHealthPanel({ vehicle }) {
  if (!vehicle) return null;

  // Fuel Helpers
  const getFuelColor = (val) => {
    if (val < 20) return '#ef4444'; // Red
    if (val < 50) return '#f59e0b'; // Orange/Yellow
    return '#10b981'; // Green
  };
  const getFuelStatus = (val) => {
    if (val < 20) return 'Critical';
    if (val < 50) return 'Warning';
    return 'Optimal';
  };

  // Temp Helpers
  const getTempColor = (val) => {
    if (val > 100) return '#ef4444'; // Red
    if (val > 90) return '#f59e0b';  // Yellow
    return '#10b981'; // Green
  };
  const getTempStatus = (val) => {
    if (val > 100) return 'Overheat';
    if (val > 90) return 'High';
    return 'Normal';
  };

  // Battery Helpers
  const getBatteryColor = (val) => {
    if (val < 11.5) return '#ef4444'; // Red
    if (val < 12.2 || val > 14.8) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };
  const getBatteryStatus = (val) => {
    if (val < 11.5) return 'Low Volt';
    if (val < 12.2 || val > 14.8) return 'Check';
    return 'Healthy';
  };

  return (
    <div className="space-y-4 select-none">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Diagnostics & Gauges
      </h4>
      <div className="grid grid-cols-3 gap-4">
        {/* Fuel Gauge */}
        <CircularGauge
          value={vehicle.fuel_level !== undefined ? vehicle.fuel_level : 0}
          max={100}
          unit="%"
          label="Fuel Level"
          icon={Fuel}
          getColor={getFuelColor}
          formatValue={(v) => Math.round(v)}
          getStatusText={getFuelStatus}
          getStatusColor={getFuelColor}
        />

        {/* Temperature Gauge */}
        <CircularGauge
          value={vehicle.engine_temp !== undefined ? vehicle.engine_temp : 0}
          max={130}
          unit="°C"
          label="Engine Temp"
          icon={Thermometer}
          getColor={getTempColor}
          formatValue={(v) => Math.round(v)}
          getStatusText={getTempStatus}
          getStatusColor={getTempColor}
        />

        {/* Battery Voltage Gauge */}
        <CircularGauge
          value={vehicle.battery_voltage !== undefined ? vehicle.battery_voltage : 12.6}
          max={16}
          unit="V"
          label="Battery Volt"
          icon={Battery}
          getColor={getBatteryColor}
          formatValue={(v) => (typeof v === 'number' ? v.toFixed(1) : v)}
          getStatusText={getBatteryStatus}
          getStatusColor={getBatteryColor}
        />
      </div>
    </div>
  );
}

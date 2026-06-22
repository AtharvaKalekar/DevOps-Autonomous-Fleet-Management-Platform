import React, { useState, useEffect } from 'react';
import StatsBar from '../components/Dashboard/StatsBar';
import FleetMap from '../components/Map/FleetMap';
import AlertsFeed from '../components/Panels/AlertsFeed';
import LegendRow from '../components/ui/LegendRow';
import api from '../services/api';

export default function Dashboard({ vehicles, alerts, onResolveAlert, onSelectVehicle }) {
  const [outages, setOutages] = useState({});

  useEffect(() => {
    const fetchOutages = async () => {
      try {
        const res = await api.getOutages();
        if (res.success) setOutages(res.data);
      } catch (err) {
        console.error('Failed to fetch outages:', err);
      }
    };
    fetchOutages();
    const interval = setInterval(fetchOutages, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalCount = vehicles.length;
  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const offlineCount = vehicles.filter(v => v.status === 'offline').length;
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

  const healthScore = totalCount > 0
    ? Math.round((
        (activeCount / totalCount) * 0.5 +
        Math.max(0, 1 - criticalAlertsCount * 0.15) * 0.3 +
        (1 - offlineCount / totalCount) * 0.2
      ) * 100)
    : 100;

  const radius = 54;
  const size = 140;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;
  const healthColor = healthScore >= 80 ? '#16a34a' : healthScore >= 50 ? '#d97706' : '#dc2626';
  const healthLabel = healthScore >= 80
    ? 'All systems operating normally'
    : healthScore >= 50
      ? 'Some units need attention'
      : 'Immediate action required';

  const regionsList = ['Asia', 'Europe', 'North America'];
  const regionBreakdowns = regionsList.map(region => {
    const rv = vehicles.filter(v => v.region === region);
    const total = rv.length;
    return {
      region,
      total,
      active: rv.filter(v => v.status === 'active').length,
      idle: rv.filter(v => v.status === 'idle').length,
      maintenance: rv.filter(v => v.status === 'maintenance').length,
      offline: rv.filter(v => v.status === 'offline').length,
      hasOutage: outages[region] === true,
    };
  });

  return (
    <div className="space-y-5">
      <StatsBar vehicles={vehicles} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fleet Health */}
        <div className="squire-card squire-card-static p-6">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-6">Fleet Health</p>
          <div className="flex flex-col items-center gap-6">
            <div className="health-ring">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle
                  cx={center} cy={center} r={radius}
                  fill="none" stroke="var(--surface-muted)" strokeWidth="10"
                />
                <circle
                  cx={center} cy={center} r={radius}
                  fill="none" stroke={healthColor} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="health-ring-label">
                <span className="health-ring-score">{healthScore}</span>
                <span className="health-ring-unit">/ 100</span>
              </div>
            </div>
            <p className="text-sm text-textSecondary text-center leading-relaxed max-w-[200px]">
              {healthLabel}
            </p>
          </div>
        </div>

        {/* Regional Breakdown */}
        <div className="squire-card squire-card-static p-6 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider flex-shrink-0">
              Regional Breakdown
            </p>
            <LegendRow />
          </div>
          <div className="space-y-4">
            {regionBreakdowns.map(({ region, total, active, idle, maintenance, offline, hasOutage }) => (
              <div key={region}>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-textPrimary">{region}</span>
                    {hasOutage && <span className="pill pill-danger flex-shrink-0">Outage</span>}
                  </div>
                  <span className="text-xs text-textMuted font-mono tabular-nums flex-shrink-0">
                    {active}/{total} active
                  </span>
                </div>
                <div className="progress-track flex h-2">
                  {total > 0 && (
                    <>
                      {active > 0 && <div className="bg-green-500 h-full" style={{ width: `${(active / total) * 100}%` }} />}
                      {idle > 0 && <div className="bg-yellow-400 h-full" style={{ width: `${(idle / total) * 100}%` }} />}
                      {maintenance > 0 && <div className="bg-orange-400 h-full" style={{ width: `${(maintenance / total) * 100}%` }} />}
                      {offline > 0 && <div className="bg-red-400 h-full" style={{ width: `${(offline / total) * 100}%` }} />}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 squire-card squire-card-static overflow-hidden flex flex-col">
          <div className="card-header">
            <div>
              <p className="card-title">Live Fleet Map</p>
              <p className="card-subtitle">{vehicles.length} vehicles tracked in real time</p>
            </div>
          </div>
          <FleetMap vehicles={vehicles} height="h-[440px]" onSelectVehicle={onSelectVehicle} />
        </div>
        <div className="xl:col-span-2">
          <AlertsFeed alerts={alerts} onResolveAlert={onResolveAlert} />
        </div>
      </div>
    </div>
  );
}

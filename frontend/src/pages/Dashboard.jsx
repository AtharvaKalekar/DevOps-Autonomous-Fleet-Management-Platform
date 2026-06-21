import React, { useState, useEffect } from 'react';
import StatsBar from '../components/Dashboard/StatsBar';
import FleetMap from '../components/Map/FleetMap';
import AlertsFeed from '../components/Panels/AlertsFeed';
import api from '../services/api';
import { Heart, Globe, Radio } from 'lucide-react';

export default function Dashboard({ vehicles, alerts, onResolveAlert, onSelectVehicle }) {
  const [outages, setOutages] = useState({});

  // Load simulator outage states occasionally
  useEffect(() => {
    const fetchOutages = async () => {
      try {
        const res = await api.getOutages();
        if (res.success) {
          setOutages(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch outages for dashboard:', err);
      }
    };
    fetchOutages();
    const interval = setInterval(fetchOutages, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- 1. Calculate Fleet Health Score ---
  const totalCount = vehicles.length;
  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const offlineCount = vehicles.filter(v => v.status === 'offline').length;
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

  const activePct = totalCount > 0 ? (activeCount / totalCount) : 1;
  const criticalFactor = Math.max(0, 1 - (criticalAlertsCount * 0.15));
  const offlinePct = totalCount > 0 ? (1 - (offlineCount / totalCount)) : 1;
  const healthScore = totalCount > 0 
    ? Math.round((activePct * 0.5 + criticalFactor * 0.3 + offlinePct * 0.2) * 100)
    : 100;

  // SVG circular properties
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // --- 2. Region Breakdown Data ---
  const regionsList = ['Asia', 'Europe', 'North America'];
  const regionBreakdowns = regionsList.map(region => {
    const regionVehicles = vehicles.filter(v => v.region === region);
    const total = regionVehicles.length;
    const active = regionVehicles.filter(v => v.status === 'active').length;
    const idle = regionVehicles.filter(v => v.status === 'idle').length;
    const maintenance = regionVehicles.filter(v => v.status === 'maintenance').length;
    const offline = regionVehicles.filter(v => v.status === 'offline').length;
    
    return {
      region,
      total,
      active,
      idle,
      maintenance,
      offline,
      hasOutage: outages[region] === true,
    };
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-textPrimary tracking-wide uppercase font-sans">
          Fleet Overview
        </h1>
        <p className="text-xs text-textSecondary font-semibold">
          Real-time analytics, diagnostics, and satellite coordinates of global logistics assets
        </p>
      </div>

      {/* Top Statistics Cards */}
      <StatsBar vehicles={vehicles} />

      {/* Operational Indicators: Fleet Health & Regional Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fleet Health Score (1/3 column span) */}
        <div className="glass-panel p-5 rounded-2xl border border-panelBorder flex flex-col items-center justify-between shadow-sm min-h-60">
          <div className="flex items-center space-x-2 self-start">
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <h4 className="text-[10px] font-extrabold text-textSecondary uppercase tracking-widest">Global Fleet Health</h4>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-panelBorder/30 fill-transparent"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r={radius}
                className={`fill-transparent transition-all duration-1000 ease-out ${
                  healthScore >= 80 ? 'stroke-green-500' :
                  healthScore >= 50 ? 'stroke-yellow-500' : 'stroke-red-500'
                }`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-mono text-textPrimary">{healthScore}%</span>
              <span className="text-[8px] font-extrabold text-textSecondary uppercase tracking-wider">Health Index</span>
            </div>
          </div>

          <p className="text-[10px] text-textSecondary font-semibold text-center">
            {healthScore >= 80 ? '🟢 Operations operating within parameters' : 
             healthScore >= 50 ? '🟡 Performance degraded, review alert console' : 
             '🔴 Critical disruptions: take corrective action'}
          </p>
        </div>

        {/* Region Breakdown Panel (2/3 column span) */}
        <div className="glass-panel p-5 rounded-2xl border border-panelBorder flex flex-col justify-between shadow-sm min-h-60 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <h4 className="text-[10px] font-extrabold text-textSecondary uppercase tracking-widest">Regional Logistics Breakdown</h4>
          </div>

          <div className="space-y-4 my-2">
            {regionBreakdowns.map(({ region, total, active, idle, maintenance, offline, hasOutage }) => (
              <div key={region} className="space-y-1.5">
                {/* Region title & Counts */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-textPrimary">{region}</span>
                    {hasOutage && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-500 uppercase tracking-wider animate-pulse">
                        <Radio className="h-2.5 w-2.5 mr-1" /> Outage
                      </span>
                    )}
                  </div>
                  <span className="text-textSecondary text-[10px] font-bold font-mono">
                    Total: {total} | Active: {active} | Offline: {offline}
                  </span>
                </div>

                {/* Stacked bar */}
                <div className="w-full bg-panelBorder h-3 rounded-full overflow-hidden flex">
                  {total > 0 ? (
                    <>
                      {active > 0 && <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(active / total) * 100}%` }} title={`Active: ${active}`} />}
                      {idle > 0 && <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${(idle / total) * 100}%` }} title={`Idle: ${idle}`} />}
                      {maintenance > 0 && <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${(maintenance / total) * 100}%` }} title={`Maintenance: ${maintenance}`} />}
                      {offline > 0 && <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(offline / total) * 100}%` }} title={`Offline: ${offline}`} />}
                    </>
                  ) : (
                    <div className="w-full bg-panelBorder h-full" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[9px] text-textSecondary uppercase font-extrabold tracking-wider border-t border-panelBorder/30 pt-2">
            <span className="flex items-center"><span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1" /> Active</span>
            <span className="flex items-center"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1" /> Idle</span>
            <span className="flex items-center"><span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-1" /> Maintenance</span>
            <span className="flex items-center"><span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1" /> Offline</span>
          </div>
        </div>
      </div>

      {/* Map and Live Alerts grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FleetMap component (60% column span -> 3/5 cols) */}
        <div className="lg:col-span-3">
          <FleetMap 
            vehicles={vehicles} 
            height="h-[500px]" 
            onSelectVehicle={onSelectVehicle} 
          />
        </div>

        {/* AlertsFeed component (40% column span -> 2/5 cols) */}
        <div className="lg:col-span-2">
          <AlertsFeed alerts={alerts} onResolveAlert={onResolveAlert} />
        </div>
      </div>
    </div>
  );
}

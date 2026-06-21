import React from 'react';
import StatsBar from '../components/Dashboard/StatsBar';
import FleetMap from '../components/Map/FleetMap';
import AlertsFeed from '../components/Panels/AlertsFeed';

export default function Dashboard({ vehicles, alerts, onResolveAlert }) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-wide uppercase">
          Fleet Overview
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Real-time analytics and telemetry of autonomous worldwide logistics assets
        </p>
      </div>

      {/* Top statistics overview bar */}
      <StatsBar vehicles={vehicles} />

      {/* Map and Alerts section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FleetMap component (60% column span -> 3/5 cols) */}
        <div className="lg:col-span-3">
          <FleetMap vehicles={vehicles} height="h-[500px]" />
        </div>

        {/* AlertsFeed component (40% column span -> 2/5 cols) */}
        <div className="lg:col-span-2">
          <AlertsFeed alerts={alerts} onResolveAlert={onResolveAlert} />
        </div>
      </div>
    </div>
  );
}

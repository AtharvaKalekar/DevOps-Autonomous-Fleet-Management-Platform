import React from 'react';
import { Activity, Cpu } from 'lucide-react';

export default function Navbar({ vehicles, connectionStatus }) {
  // Count active vehicles
  const activeCount = vehicles.filter(v => v.status === 'active').length;

  return (
    <header className="bg-white border-b border-panelBorder h-16 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-accentBlue/10 p-2 rounded-lg text-accentBlue border border-accentBlue/20">
          <Cpu className="h-5 w-5" />
        </div>
        <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-accentBlue to-indigo-600">
          AUTOFLEET
        </span>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest border border-panelBorder px-2 py-0.5 rounded bg-slate-50">
          v1.0
        </span>
      </div>

      {/* Connection Status Badge */}
      <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-panelBorder px-3 py-1.5 rounded-full text-xs">
        <span className={`h-2.5 w-2.5 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
        }`} />
        <span className="text-slate-600 font-medium">
          System Status: <span className="capitalize text-slate-800 font-semibold">{connectionStatus}</span>
        </span>
      </div>

      {/* Active Vehicles & LIVE Blinking badge */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium bg-slate-50 border border-panelBorder px-3 py-1.5 rounded-lg">
          <Activity className="h-4 w-4 text-green-600" />
          <span>Active Fleet:</span>
          <span className="text-slate-900 font-bold">{activeCount} / {vehicles.length}</span>
        </div>

        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs font-bold text-red-600 tracking-wider uppercase animate-blink">
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}

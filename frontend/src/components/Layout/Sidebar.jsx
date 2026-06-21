import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Map, Truck, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Sidebar({ activeTab, setActiveTab, unresolvedCount }) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'livemap', name: 'Live Map', icon: Map },
    { id: 'vehicles', name: 'Vehicles', icon: Truck },
    {
      id: 'alerts',
      name: 'Alerts',
      icon: AlertTriangle,
      badge: unresolvedCount > 0 ? unresolvedCount : null,
    },
  ];

  const [outages, setOutages] = useState({
    'Asia': false,
    'Europe': false,
    'North America': false,
  });

  // Load initial simulator outages
  useEffect(() => {
    const loadOutages = async () => {
      try {
        const res = await api.getOutages();
        if (res.success) {
          setOutages(res.data);
        }
      } catch (err) {
        console.error('Failed to load simulator outages:', err);
      }
    };
    loadOutages();
  }, []);

  // Outage Toggle Switch Trigger
  const handleToggleOutage = async (region) => {
    const nextVal = !outages[region];
    try {
      const res = await api.toggleOutage(region, nextVal);
      if (res.success) {
        setOutages(res.data);
        if (nextVal) {
          toast.error(`💥 Simulated outages triggered for region: ${region}! All devices disconnected.`, { duration: 4000 });
        } else {
          toast.success(`✅ Network connectivity recovered for region: ${region}. Devices reconnecting...`, { duration: 4000 });
        }
      }
    } catch (err) {
      console.error('Outage toggle failed:', err);
      toast.error('Failed to toggle outage simulation.');
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-panelBorder h-[calc(100vh-4rem)] flex flex-col justify-between select-none shadow-sm">
      {/* Navigation Links */}
      <div className="py-6 px-4 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest px-3 uppercase">
          Navigation
        </span>
        <nav className="space-y-1 mt-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-accentBlue text-white shadow-md shadow-accentBlue/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive 
                      ? 'bg-white text-accentBlue' 
                      : 'bg-red-500 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* DevOps Chaos Outage Panel */}
      <div className="px-4 py-4 border-t border-panelBorder space-y-3 bg-slate-50/30">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest px-3 uppercase block">
          DevOps Chaos Engine
        </span>
        <div className="space-y-2">
          {Object.keys(outages).map((region) => {
            const isActive = outages[region];
            return (
              <div key={region} className="flex items-center justify-between px-3 py-1.5 bg-white border border-panelBorder rounded-xl text-xs shadow-sm">
                <span className="text-slate-600 font-bold">{region} Outage</span>
                <button
                  onClick={() => handleToggleOutage(region)}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 border focus:outline-none ${
                    isActive ? 'bg-red-500 border-red-600' : 'bg-slate-200 border-slate-300'
                  }`}
                  title={`Trigger outage in ${region}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm ${
                    isActive ? 'left-[22px]' : 'left-[3px]'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / System Health info */}
      <div className="p-4 border-t border-panelBorder">
        <div className="bg-slate-50 p-3 rounded-lg border border-panelBorder">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Simulation Server</span>
            <span className="text-green-600 font-bold">ONLINE</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-[100%] animate-pulse" />
          </div>
          <p className="text-[9px] text-slate-400 mt-2 text-center font-medium">
            Logistics Autonomous Agent Network
          </p>
        </div>
      </div>
    </aside>
  );
}

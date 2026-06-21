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
    <aside className="w-64 bg-panelBg border-r border-panelBorder h-[calc(100vh-4rem)] flex flex-col justify-between select-none transition-all duration-300">
      {/* Navigation Links */}
      <div className="py-6 px-4 space-y-2">
        <span className="text-[10px] font-extrabold text-textSecondary tracking-widest px-3 uppercase block">
          Navigation
        </span>
        <nav className="space-y-1.5 mt-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between py-3 rounded-lg text-sm font-semibold transition-all duration-200 border-l-4 ${
                  isActive
                    ? 'bg-accentBlue/10 text-accentBlue border-accentBlue px-2.5'
                    : 'text-textSecondary border-transparent hover:bg-panelBg hover:text-textPrimary px-2.5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-4.5 w-4.5 ${isActive ? 'text-accentBlue' : 'text-textSecondary'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive 
                      ? 'bg-accentBlue text-white shadow-sm' 
                      : 'bg-red-500 text-white pulse-live-badge'
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
      <div className="px-4 py-4 border-t border-panelBorder space-y-3 bg-panelBg/20">
        <span className="text-[10px] font-extrabold text-textSecondary tracking-widest px-3 uppercase block">
          DevOps Chaos Engine
        </span>
        <div className="space-y-2">
          {Object.keys(outages).map((region) => {
            const isActive = outages[region];
            return (
              <div key={region} className="flex items-center justify-between px-3 py-2 bg-panelBg border border-panelBorder rounded-xl text-xs shadow-sm">
                <span className="text-textSecondary font-bold">{region} Outage</span>
                <button
                  onClick={() => handleToggleOutage(region)}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 border focus:outline-none ${
                    isActive ? 'bg-red-500 border-red-600' : 'bg-panelBg border-panelBorder'
                  }`}
                  title={`Trigger outage in ${region}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full absolute top-[2px] transition-all duration-200 shadow-sm ${
                    isActive ? 'bg-white left-[22px]' : 'bg-textSecondary left-[3px]'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / System Health info */}
      <div className="p-4 border-t border-panelBorder bg-panelBg/10">
        <div className="bg-panelBg p-3 rounded-lg border border-panelBorder shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-textSecondary mb-1.5 font-bold uppercase">
            <span>Simulation Server</span>
            <span className="text-green-500 font-extrabold">ONLINE</span>
          </div>
          <div className="w-full bg-panelBorder h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-[100%] animate-pulse" />
          </div>
          <p className="text-[9px] text-textSecondary mt-2 text-center font-semibold">
            Logistics Autonomous Agent Network
          </p>
        </div>
      </div>
    </aside>
  );
}

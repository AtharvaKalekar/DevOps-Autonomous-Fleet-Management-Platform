import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Sun, Moon } from 'lucide-react';

export default function Navbar({ vehicles, connectionStatus }) {
  // Count active vehicles
  const activeCount = vehicles.filter(v => v.status === 'active').length;

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('light') ? 'light' : 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    setTheme(nextTheme);
  };

  return (
    <header className="bg-panelBg border-b border-panelBorder backdrop-blur-md h-16 px-6 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-accentBlue/10 p-2 rounded-lg text-accentBlue border border-accentBlue/20">
          <Cpu className="h-5 w-5 animate-pulse" />
        </div>
        <span className="font-black text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-accentBlue to-cyan-500 font-sans">
          AUTOFLEET
        </span>
        <span className="text-[9px] uppercase font-bold text-textSecondary border border-panelBorder px-1.5 py-0.5 rounded bg-panelBg">
          OPS CENTER
        </span>
      </div>

      {/* Center - System Status & Theme Toggle */}
      <div className="flex items-center space-x-4">
        {/* Connection Status Badge */}
        <div className="hidden sm:flex items-center space-x-2 bg-panelBg border border-panelBorder px-3 py-1.5 rounded-full text-xs text-textSecondary">
          <span className={`h-2 w-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500 pulse-live-badge' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span>
            System: <span className="capitalize text-textPrimary font-bold font-mono">{connectionStatus}</span>
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="bg-panelBg border border-panelBorder hover:bg-accentBlue/10 p-2 rounded-lg text-textSecondary hover:text-accentBlue transition-all duration-200"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Active Vehicles & LIVE Blinking badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs text-textSecondary bg-panelBg border border-panelBorder px-3 py-1.5 rounded-lg">
          <Activity className="h-4 w-4 text-green-500" />
          <span className="hidden md:inline font-medium">Active:</span>
          <span className="text-textPrimary font-extrabold font-mono">{activeCount} / {vehicles.length}</span>
        </div>

        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-extrabold text-red-500 tracking-widest uppercase">
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}

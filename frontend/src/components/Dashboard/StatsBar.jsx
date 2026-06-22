import React, { useState, useEffect } from 'react';
import { Truck, Activity, Wrench, WifiOff } from 'lucide-react';

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (display === value) return;
    const start = display;
    const end = value;
    const duration = 500;
    const t0 = performance.now();
    let raf;

    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setDisplay(Math.round(start + (end - start) * (p * (2 - p))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="stat-value tabular-nums">{display}</span>
  );
}

export default function StatsBar({ vehicles }) {
  const total = vehicles.length;
  const active = vehicles.filter(v => v.status === 'active').length;
  const idle = vehicles.filter(v => v.status === 'idle').length;
  const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
  const offline = vehicles.filter(v => v.status === 'offline').length;

  const stats = [
    { label: 'Total Fleet', value: total, sub: 'Registered vehicles', icon: Truck, accent: '#2563eb' },
    { label: 'Active', value: active, sub: `${idle} on standby`, icon: Activity, accent: '#16a34a' },
    { label: 'Maintenance', value: maintenance, sub: 'In service bay', icon: Wrench, accent: '#d97706' },
    { label: 'Offline', value: offline, sub: 'No signal', icon: WifiOff, accent: '#dc2626' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, sub, icon: Icon, accent }) => (
        <div key={label} className="stat-card" style={{ '--stat-accent': accent }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label">{label}</p>
              <AnimatedNumber value={value} />
              <p className="stat-sub">{sub}</p>
            </div>
            <div className="stat-icon" style={{ background: `${accent}14`, color: accent }}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

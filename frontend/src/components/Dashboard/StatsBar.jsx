import React, { useState, useEffect } from 'react';
import { Truck, Activity, Wrench, WifiOff, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 600; // ms
    const startTime = performance.now();

    let animationFrameId;

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    }

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <span className="font-mono font-black text-3xl tracking-tight text-textPrimary">{displayValue}</span>;
}

export default function StatsBar({ vehicles }) {
  const total = vehicles.length;
  const active = vehicles.filter(v => v.status === 'active').length;
  const idle = vehicles.filter(v => v.status === 'idle').length;
  const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
  const offline = vehicles.filter(v => v.status === 'offline').length;

  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  const maintPct = total > 0 ? Math.round((maintenance / total) * 100) : 0;
  const offlinePct = total > 0 ? Math.round((offline / total) * 100) : 0;
  const totalPct = 100;

  const stats = [
    {
      name: 'Total Fleet Capacity',
      value: total,
      subText: 'Global Fleet Size',
      icon: Truck,
      percentage: totalPct,
      percentageLabel: '100% capacity',
      borderColor: 'border-l-blue-500',
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      progressColor: 'bg-blue-500',
      trend: { text: '+0% this week', isUp: true }
    },
    {
      name: 'Active Logistics',
      value: active,
      subText: `${idle} Idle / Standby`,
      icon: Activity,
      percentage: activePct,
      percentageLabel: `${activePct}% of total`,
      borderColor: 'border-l-green-500',
      iconColor: 'text-green-400 bg-green-500/10 border-green-500/20',
      progressColor: 'bg-green-500',
      trend: { text: 'Optimal status', isUp: true }
    },
    {
      name: 'Under Maintenance',
      value: maintenance,
      subText: 'Scheduled / Repair',
      icon: Wrench,
      percentage: maintPct,
      percentageLabel: `${maintPct}% of total`,
      borderColor: 'border-l-amber-500',
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      progressColor: 'bg-amber-500',
      trend: { text: '-2% reduction', isUp: true }
    },
    {
      name: 'Offline Units',
      value: offline,
      subText: 'No Telemetry Received',
      icon: WifiOff,
      percentage: offlinePct,
      percentageLabel: `${offlinePct}% of total`,
      borderColor: 'border-l-red-500',
      iconColor: 'text-red-400 bg-red-500/10 border-red-500/20',
      progressColor: 'bg-red-500',
      trend: { text: '+1 unit lost', isUp: false }
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-fade-in">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className={`glass-panel border-l-4 ${stat.borderColor} p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-40`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-textSecondary uppercase tracking-widest block">
                  {stat.name}
                </span>
                <div className="flex items-baseline space-x-2">
                  <AnimatedNumber value={stat.value} />
                  {stat.trend && (
                    <span className={`text-[10px] font-bold flex items-center ${stat.trend.isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.trend.isUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                      {stat.trend.text}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl border shadow-sm ${stat.iconColor}`}>
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            {/* Bottom progress metrics row */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-[9px] text-textSecondary font-bold uppercase tracking-wider">
                <span>{stat.subText}</span>
                <span className="text-textPrimary font-mono">{stat.percentageLabel}</span>
              </div>
              <div className="w-full bg-panelBorder h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stat.progressColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

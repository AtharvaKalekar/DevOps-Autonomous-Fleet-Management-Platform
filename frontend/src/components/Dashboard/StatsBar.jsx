import React from 'react';
import { Truck, Play, Wrench, WifiOff } from 'lucide-react';

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
      name: 'Total Vehicles',
      value: total,
      subText: 'Global Fleet Size',
      icon: Truck,
      percentage: totalPct,
      percentageLabel: '100% capacity',
      color: 'from-blue-50/50 to-white border-blue-100 text-blue-600',
      progressColor: 'bg-blue-500',
    },
    {
      name: 'Active Fleet',
      value: active,
      subText: `${idle} Idle / Standby`,
      icon: Play,
      percentage: activePct,
      percentageLabel: `${activePct}% of total`,
      color: 'from-green-50/50 to-white border-green-100 text-green-600',
      progressColor: 'bg-green-500',
    },
    {
      name: 'In Maintenance',
      value: maintenance,
      subText: 'Scheduled / Repair',
      icon: Wrench,
      percentage: maintPct,
      percentageLabel: `${maintPct}% of total`,
      color: 'from-orange-50/50 to-white border-orange-100 text-orange-600',
      progressColor: 'bg-orange-500',
    },
    {
      name: 'Offline Units',
      value: offline,
      subText: 'No Signal Received',
      icon: WifiOff,
      percentage: offlinePct,
      percentageLabel: `${offlinePct}% of total`,
      color: 'from-red-50/50 to-white border-red-100 text-red-600',
      progressColor: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-fade-in">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-gradient-to-br ${stat.color} border p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md h-40`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  {stat.name}
                </span>
                <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-inherit shadow-sm">
                <IconComponent className="h-5.5 w-5.5" />
              </div>
            </div>

            {/* Bottom progress metrics row */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span>{stat.subText}</span>
                <span className="text-slate-500">{stat.percentageLabel}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/20">
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

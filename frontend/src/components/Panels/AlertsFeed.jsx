import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SEVERITY_STYLES = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-400',
  high: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

export default function AlertsFeed({ alerts, onResolveAlert }) {
  const [resolvingId, setResolvingId] = useState(null);

  // Take the 10 latest alerts
  const latestAlerts = alerts.slice(0, 10);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      const res = await api.resolveAlert(id);
      if (res.success) {
        toast.success('Alert resolved successfully.');
        if (onResolveAlert) {
          onResolveAlert(id);
        }
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      toast.error('Failed to resolve alert. Please try again.');
    } finally {
      setResolvingId(null);
    }
  };

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[500px] overflow-hidden shadow-sm transition-all duration-300">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-panelBorder flex items-center justify-between bg-panelBg/20">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
          <h3 className="font-extrabold text-textPrimary tracking-widest text-xs uppercase">
            Live Alerts Feed
          </h3>
        </div>
        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
          {alerts.length} Active
        </span>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-panelBg/10">
        {latestAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-full text-green-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-textPrimary text-sm font-extrabold">All Systems Nominal</p>
              <p className="text-textSecondary text-xs max-w-[200px] mt-1 mx-auto font-semibold">No active anomalies detected.</p>
            </div>
          </div>
        ) : (
          latestAlerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between space-x-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${style}`}
              >
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-textPrimary/80">
                      {alert.vehicle_name}
                    </span>
                    <span className="text-[9px] text-textSecondary font-mono font-semibold">
                      {formatTime(alert.updated_at || alert.created_at)}
                    </span>
                  </div>
                  <div className="flex items-start text-xs text-textPrimary leading-relaxed font-semibold break-words">
                    <span className="truncate-2-lines flex-1">{alert.message}</span>
                    {alert.occurrence_count > 1 && (
                      <span className="ml-2 px-1.5 py-0.2 text-[8px] font-bold bg-red-500/20 text-red-400 border border-red-500/25 rounded-md animate-pulse font-mono self-center">
                        ×{alert.occurrence_count}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolvingId === alert.id}
                  className="bg-panelBg hover:bg-green-600 hover:text-white border border-panelBorder rounded-lg p-1.5 text-textSecondary hover:scale-105 active:scale-95 transition-all self-center disabled:opacity-50 shadow-sm"
                  title="Mark as Resolved"
                >
                  {resolvingId === alert.id ? (
                    <span className="block h-4 w-4 border-2 border-t-transparent border-slate-500 rounded-full animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SEVERITY_STYLES = {
  critical: 'bg-red-50/70 border-red-200 text-red-800',
  high: 'bg-orange-50/70 border-orange-200 text-orange-800',
  medium: 'bg-yellow-50/70 border-yellow-200 text-yellow-800',
  low: 'bg-blue-50/70 border-blue-200 text-blue-800',
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
    <div className="bg-white border border-panelBorder rounded-2xl flex flex-col h-[500px] overflow-hidden shadow-sm">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-panelBorder flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
          <h3 className="font-bold text-slate-800 tracking-wider text-sm uppercase">
            Live Alerts Feed
          </h3>
        </div>
        <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-2 py-0.5 rounded-full">
          {alerts.length} Active
        </span>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        {latestAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="bg-green-50 border border-green-200 p-4 rounded-full text-green-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="text-slate-800 text-sm font-bold">All Systems Nominal</p>
            <p className="text-slate-400 text-xs max-w-[200px]">No active telemetry alerts at this moment.</p>
          </div>
        ) : (
          latestAlerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between space-x-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${style}`}
              >
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {alert.vehicle_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {formatTime(alert.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium truncate-2-lines break-words">
                    {alert.message}
                  </p>
                </div>

                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolvingId === alert.id}
                  className="bg-white hover:bg-green-600 hover:text-white border border-slate-200 rounded-lg p-1.5 text-slate-500 hover:scale-105 active:scale-95 transition-all self-center disabled:opacity-50 shadow-sm"
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

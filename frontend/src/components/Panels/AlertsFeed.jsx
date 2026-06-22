import React, { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusPill from '../ui/StatusPill';

export default function AlertsFeed({ alerts, onResolveAlert }) {
  const [resolvingId, setResolvingId] = useState(null);
  const latestAlerts = alerts.slice(0, 10);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      const res = await api.resolveAlert(id);
      if (res.success) {
        toast.success('Alert resolved.');
        onResolveAlert?.(id);
      }
    } catch {
      toast.error('Failed to resolve alert.');
    } finally {
      setResolvingId(null);
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="squire-card squire-card-static flex flex-col h-full min-h-[440px] overflow-hidden">
      <div className="card-header">
        <div>
          <p className="card-title">Live Alerts</p>
          <p className="card-subtitle">Most recent anomalies</p>
        </div>
        {alerts.length > 0 && (
          <span className="pill pill-danger">{alerts.length} open</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {latestAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
            <div className="empty-state-icon">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-textPrimary">All clear</p>
              <p className="text-xs text-textMuted mt-1">No active alerts right now.</p>
            </div>
          </div>
        ) : (
          latestAlerts.map((alert) => (
            <div
              key={alert.id}
              className="group flex items-start gap-3 p-3 rounded-xl border border-panelBorder hover:border-accentBlue/20 hover:bg-surfaceHover transition-all"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-textPrimary truncate">{alert.vehicle_name}</span>
                  <span className="text-[10px] text-textMuted font-mono flex-shrink-0 tabular-nums">
                    {formatTime(alert.updated_at || alert.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={alert.severity} />
                  {alert.occurrence_count > 1 && (
                    <span className="text-[10px] font-bold text-red-500 font-mono">×{alert.occurrence_count}</span>
                  )}
                </div>
                <p className="text-xs text-textSecondary leading-relaxed line-clamp-2">{alert.message}</p>
              </div>
              <button
                onClick={() => handleResolve(alert.id)}
                disabled={resolvingId === alert.id}
                className="btn-ghost flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                title="Resolve"
              >
                {resolvingId === alert.id ? (
                  <span className="block h-3.5 w-3.5 border-2 border-t-transparent border-accentBlue rounded-full animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

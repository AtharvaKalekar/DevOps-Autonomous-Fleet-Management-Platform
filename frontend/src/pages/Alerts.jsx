import React, { useState, useEffect } from 'react';
import { Check, Loader, ShieldCheck, RefreshCw, Search, X, CheckSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import StatusPill from '../components/ui/StatusPill';

export default function Alerts({ alerts: globalAlerts, setAlerts: setGlobalAlerts }) {
  const [localAlerts, setLocalAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('false');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAlerts = async (silent = false) => {
    if (statusFilter === 'false') {
      if (!silent) setLoading(true);
      try {
        const res = await api.getAlerts('false');
        if (res.success) {
          setGlobalAlerts(res.data);
        }
      } catch {
        if (!silent) toast.error('Failed to sync alerts.');
      } finally {
        if (!silent) setLoading(false);
      }
    } else {
      if (!silent) setLoading(true);
      try {
        const res = await api.getAlerts(statusFilter);
        if (res.success) {
          setLocalAlerts(res.data);
        }
      } catch {
        if (!silent) toast.error('Failed to sync alerts.');
      } finally {
        if (!silent) setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (statusFilter === 'false') {
      setLocalAlerts(globalAlerts);
    }
  }, [globalAlerts, statusFilter]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(true), 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      const res = await api.resolveAlert(id);
      if (res.success) {
        toast.success('Alert resolved.');
        setGlobalAlerts(prev => prev.filter(a => a.id !== id));
        setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
      }
    } catch {
      toast.error('Could not resolve alert.');
    } finally {
      setResolvingId(null);
    }
  };

  const handleResolveAll = async () => {
    setLoading(true);
    try {
      const severity = severityFilter === 'all' ? null : severityFilter;
      let vehicle_id = null;
      if (searchQuery.trim()) {
        const ids = [...new Set(filteredAlerts.map(a => a.vehicle_id))];
        if (ids.length === 1) vehicle_id = ids[0];
      }
      const res = await api.resolveAllAlerts({ severity, vehicle_id });
      if (res.success) {
        toast.success('Alerts resolved.');
        fetchAlerts();
      }
    } catch {
      toast.error('Failed to resolve alerts.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = localAlerts.filter((alert) => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.vehicle_name?.toLowerCase().includes(q) ||
        alert.vehicle_id?.toLowerCase().includes(q) ||
        alert.message?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const fmt = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="squire-card squire-card-static p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted pointer-events-none" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ui-input w-full pl-9 pr-9"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ui-select">
            <option value="false">Unresolved</option>
            <option value="true">Resolved</option>
            <option value="all">All</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="ui-select">
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2 md:ml-auto">
          {statusFilter === 'false' && filteredAlerts.length > 0 && (
            <button onClick={handleResolveAll} disabled={loading} className="btn-primary">
              <CheckSquare className="h-4 w-4" />
              Resolve all
            </button>
          )}
          <button onClick={() => fetchAlerts()} disabled={loading} className="btn-ghost" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="squire-card squire-card-static overflow-hidden">
        {loading && filteredAlerts.length === 0 ? (
          <div className="empty-state py-20">
            <Loader className="h-7 w-7 text-accentBlue animate-spin" />
            <p className="text-sm text-textMuted">Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="empty-state py-20">
            <div className="empty-state-icon"><ShieldCheck className="h-7 w-7" /></div>
            <p className="text-sm font-semibold text-textPrimary">All clear</p>
            <p className="text-xs text-textMuted">No alerts match your filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Time</th>
                  {statusFilter !== 'true' && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td><StatusPill status={alert.severity} /></td>
                    <td>
                      <div className="font-semibold text-textPrimary">{alert.vehicle_name}</div>
                      <div className="text-[11px] text-textMuted font-mono truncate max-w-[140px]">{alert.vehicle_id}</div>
                    </td>
                    <td className="font-mono text-[11px] uppercase">{alert.type.replace('_', ' ')}</td>
                    <td className="text-textPrimary max-w-xs">
                      <span className="line-clamp-2">{alert.message}</span>
                      {alert.occurrence_count > 1 && (
                        <span className="ml-1 text-[10px] font-bold text-red-500 font-mono">×{alert.occurrence_count}</span>
                      )}
                    </td>
                    <td className="font-mono text-[11px] tabular-nums whitespace-nowrap">{fmt(alert.updated_at || alert.created_at)}</td>
                    {statusFilter !== 'true' && (
                      <td style={{ textAlign: 'right' }}>
                        {alert.resolved ? (
                          <span className="pill pill-success">Resolved</span>
                        ) : (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            disabled={resolvingId === alert.id}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            {resolvingId === alert.id ? (
                              <span className="block h-3.5 w-3.5 border-2 border-t-transparent border-accentBlue rounded-full animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Resolve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

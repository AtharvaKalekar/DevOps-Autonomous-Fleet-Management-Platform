import React, { useState, useEffect } from 'react';
import { Map, Truck, AlertTriangle, Home, LogOut, Sun, Moon, ChevronDown, Zap } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PAGE_META = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Real-time fleet overview, health metrics, and live telemetry.',
  },
  livemap: {
    title: 'Live Map',
    subtitle: 'Track vehicle positions and status across all regions.',
  },
  vehicles: {
    title: 'Vehicles',
    subtitle: 'Browse, filter, and inspect your entire fleet inventory.',
  },
  alerts: {
    title: 'Alerts',
    subtitle: 'Monitor and resolve diagnostic alerts from active vehicles.',
  },
};

export default function Sidebar({ activeTab, setActiveTab, unresolvedCount, connectionStatus, vehicles }) {
  const navItems = [
    { id: 'dashboard', name: 'Home', icon: Home },
    { id: 'livemap', name: 'Live Map', icon: Map },
    { id: 'vehicles', name: 'Vehicles', icon: Truck },
    { id: 'alerts', name: 'Alerts', icon: AlertTriangle, badge: unresolvedCount > 0 ? unresolvedCount : null },
  ];

  const [outages, setOutages] = useState({ Asia: false, Europe: false, 'North America': false });
  const [chaosOpen, setChaosOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const outageCount = Object.values(outages).filter(Boolean).length;

  useEffect(() => {
    api.getOutages().then(res => { if (res.success) setOutages(res.data); }).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    setTheme(next);
  };

  const handleToggleOutage = async (region) => {
    const nextVal = !outages[region];
    try {
      const res = await api.toggleOutage(region, nextVal);
      if (res.success) {
        setOutages(res.data);
        toast[nextVal ? 'error' : 'success'](
          nextVal ? `Outage triggered: ${region}` : `Recovered: ${region}`,
          { duration: 3000 }
        );
      }
    } catch {
      toast.error('Failed to toggle outage.');
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Truck className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="sidebar-brand-name">AutoFleet</span>
          <span className="sidebar-brand-sub">Ops Console</span>
        </div>
      </div>

      {/* Navigation — always visible with outlines */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Menu</p>
        <div className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
              >
                <span className="sidebar-nav-item-inner">
                  <Icon className="sidebar-nav-icon" />
                  <span>{item.name}</span>
                </span>
                {item.badge != null && (
                  <span className={`sidebar-nav-badge ${isActive ? 'sidebar-nav-badge-active' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-spacer" />

      {/* Chaos Engine */}
      <div className="sidebar-chaos">
        <button type="button" onClick={() => setChaosOpen(v => !v)} className="sidebar-chaos-toggle">
          <span className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
            <Zap className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <span>Chaos Engine</span>
            {outageCount > 0 && <span className="pill pill-danger">{outageCount}</span>}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-textMuted transition-transform flex-shrink-0 ${chaosOpen ? 'rotate-180' : ''}`} />
        </button>
        {chaosOpen && (
          <div className="sidebar-chaos-body">
            {Object.keys(outages).map((region) => (
              <div key={region} className="flex items-center justify-between py-1.5 gap-2">
                <span className="text-xs text-textSecondary font-medium truncate">{region}</span>
                <button
                  type="button"
                  onClick={() => handleToggleOutage(region)}
                  className={`sidebar-toggle ${outages[region] ? 'sidebar-toggle-on' : ''}`}
                  aria-label={`Toggle outage for ${region}`}
                >
                  <span className="sidebar-toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span
            className={`live-dot ${connectionStatus === 'connected' ? 'connected' : ''}`}
            style={{
              background: connectionStatus === 'connected' ? 'var(--success-color)' :
                connectionStatus === 'connecting' ? 'var(--warning-color)' : 'var(--danger-color)',
            }}
          />
          <span className="text-xs text-textMuted capitalize">{connectionStatus}</span>
          <span className="text-textMuted text-xs">·</span>
          <span className="text-xs font-mono font-semibold text-textPrimary tabular-nums">
            {activeCount}/{vehicles.length}
          </span>
        </div>

        <div className="sidebar-user">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="avatar">OA</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-textPrimary truncate leading-tight">Ops Admin</p>
              <button type="button" onClick={toggleTheme} className="sidebar-theme-btn">
                {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>
          <button type="button" className="sidebar-logout-btn" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { PAGE_META };

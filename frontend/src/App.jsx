import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWebSocket } from './hooks/useWebSocket';
import Sidebar, { PAGE_META } from './components/Layout/Sidebar';
import PageHeader from './components/ui/PageHeader';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Alerts from './pages/Alerts';
import FleetMap from './components/Map/FleetMap';
import VehicleDetailDrawer from './components/Panels/VehicleDetailDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { vehicles, setVehicles, alerts, setAlerts, connectionStatus } = useWebSocket();
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const handleResolveAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const meta = PAGE_META[activeTab] || PAGE_META.dashboard;
  const activeCount = vehicles.filter(v => v.status === 'active').length;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            vehicles={vehicles}
            alerts={alerts}
            onResolveAlert={handleResolveAlert}
            onSelectVehicle={setSelectedVehicleId}
          />
        );
      case 'livemap':
        return (
          <div className="squire-card squire-card-static overflow-hidden animate-fade-in">
            <FleetMap
              vehicles={vehicles}
              height="h-[calc(100vh-220px)] min-h-[480px]"
              onSelectVehicle={setSelectedVehicleId}
            />
          </div>
        );
      case 'vehicles':
        return (
          <Vehicles
            vehicles={vehicles}
            setVehicles={setVehicles}
            onSelectVehicle={setSelectedVehicleId}
          />
        );
      case 'alerts':
        return <Alerts alerts={alerts} setAlerts={setAlerts} />;
      default:
        return <div className="empty-state"><p className="text-textMuted">Page not found.</p></div>;
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unresolvedCount={alerts.length}
        connectionStatus={connectionStatus}
        vehicles={vehicles}
      />

      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
          <PageHeader title={meta.title} subtitle={meta.subtitle}>
            <div className="flex items-center gap-2">
              <span className={`live-dot ${connectionStatus === 'connected' ? 'connected' : ''}`}
                style={{
                  background: connectionStatus === 'connected' ? 'var(--success-color)' :
                    connectionStatus === 'connecting' ? 'var(--warning-color)' : 'var(--danger-color)'
                }}
              />
              <span className="text-xs font-medium text-textSecondary capitalize hidden sm:inline">
                {connectionStatus}
              </span>
              <span className="hidden sm:inline text-textMuted">·</span>
              <span className="text-xs font-semibold text-textPrimary font-mono hidden sm:inline">
                {activeCount}/{vehicles.length} active
              </span>
            </div>
          </PageHeader>

          <div className="animate-fade-in" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
            {renderContent()}
          </div>
        </div>
      </main>

      {selectedVehicleId && (
        <div className="drawer-overlay animate-fade-overlay" onClick={() => setSelectedVehicleId(null)} />
      )}

      <VehicleDetailDrawer
        vehicleId={selectedVehicleId}
        vehicles={vehicles}
        alerts={alerts}
        setAlerts={setAlerts}
        onClose={() => setSelectedVehicleId(null)}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-panelBorder shadow-card-lg font-medium text-sm rounded-xl bg-panelBg text-textPrimary',
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWebSocket } from './hooks/useWebSocket';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Alerts from './pages/Alerts';
import FleetMap from './components/Map/FleetMap';
import VehicleDetailDrawer from './components/Panels/VehicleDetailDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { vehicles, setVehicles, alerts, setAlerts, connectionStatus } = useWebSocket();
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Helper to remove alert from list when resolved in another component
  const handleResolveAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

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
          <div className="space-y-4 h-[calc(100vh-10rem)]">
            <div>
              <h1 className="text-2xl font-black text-textPrimary tracking-wide uppercase font-sans">
                Live Fleet Map
              </h1>
              <p className="text-xs text-textSecondary font-semibold">
                Real-time positioning and satellite tracking of global logistics assets
              </p>
            </div>
            <div className="flex-1 h-full min-h-[480px]">
              <FleetMap 
                vehicles={vehicles} 
                height="h-full" 
                onSelectVehicle={setSelectedVehicleId} 
              />
            </div>
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
        return (
          <div className="text-center text-textSecondary py-12 font-bold uppercase tracking-wider">
            Page not found.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex flex-col font-sans transition-colors duration-300">
      {/* Top Navigation Bar */}
      <Navbar vehicles={vehicles} connectionStatus={connectionStatus} />

      {/* Main Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Navigation Panel */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unresolvedCount={alerts.length}
        />

        {/* Dynamic Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 bg-darkBg">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Slide-In Telemetry Details Panel */}
      <VehicleDetailDrawer
        vehicleId={selectedVehicleId}
        vehicles={vehicles}
        alerts={alerts}
        setAlerts={setAlerts}
        onClose={() => setSelectedVehicleId(null)}
      />

      {/* Global Notification Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-panelBorder shadow-xl font-bold text-xs rounded-xl bg-panelBg text-textPrimary backdrop-blur-md',
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

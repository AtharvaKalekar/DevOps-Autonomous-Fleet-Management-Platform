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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { vehicles, setVehicles, alerts, setAlerts, connectionStatus } = useWebSocket();

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
          />
        );
      case 'livemap':
        return (
          <div className="space-y-4 h-[calc(100vh-10rem)]">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-wide uppercase">
                Live Fleet Map
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Real-time tracking of logistics vehicles globally
              </p>
            </div>
            <div className="flex-1 h-full min-h-[480px]">
              <FleetMap vehicles={vehicles} height="h-full" />
            </div>
          </div>
        );
      case 'vehicles':
        return <Vehicles vehicles={vehicles} setVehicles={setVehicles} />;
      case 'alerts':
        return <Alerts alerts={alerts} setAlerts={setAlerts} />;
      default:
        return (
          <div className="text-center text-slate-400 py-12 font-bold">
            Page not found.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-slate-800 flex flex-col font-sans">
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

      {/* Global Notification Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-slate-200 shadow-xl font-bold text-xs rounded-xl bg-white text-slate-800',
          success: {
            iconTheme: {
              primary: '#10b981',
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

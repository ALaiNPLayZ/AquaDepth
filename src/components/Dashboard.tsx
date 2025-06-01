import React from 'react';
import { 
  Waves, 
  Map, 
  AlertTriangle, 
  History, 
  Droplets,
  LineChart,
  Navigation
} from 'lucide-react';

const mockData = {
  currentDepth: 45.2,
  sedimentLevel: 12.3,
  location: { lat: 40.7128, lng: -74.0060 },
  alerts: [
    { id: 1, message: "High sediment accumulation detected in Zone A", severity: "warning" },
    { id: 2, message: "Depth threshold exceeded in monitoring point B3", severity: "critical" }
  ]
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="h-8 w-8" />
            <h1 className="text-2xl font-bold">AquaDepth Monitor</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              <span className="font-medium">Live Monitoring</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Depth Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Current Depth</h3>
              <Droplets className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{mockData.currentDepth}m</p>
            <p className="text-sm text-gray-500 mt-2">Updated 2 minutes ago</p>
          </div>

          {/* Sediment Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Sediment Level</h3>
              <LineChart className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-600">{mockData.sedimentLevel}m</p>
            <p className="text-sm text-gray-500 mt-2">Critical threshold: 15m</p>
          </div>

          {/* Alerts Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Active Alerts</h3>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="space-y-3">
              {mockData.alerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-md ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map and History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Location Map</h3>
              <Map className="h-6 w-6 text-gray-500" />
            </div>
            <div className="bg-gray-100 h-80 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Map integration coming soon</p>
            </div>
          </div>

          {/* Historical Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Historical Data</h3>
              <History className="h-6 w-6 text-gray-500" />
            </div>
            <div className="bg-gray-100 h-80 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Historical data visualization coming soon</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
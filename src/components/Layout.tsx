import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  Waves,
  LayoutDashboard,
  MapPin,
  LineChart,
  Bell,
  Settings as SettingsIcon,
  BrainCircuit
} from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-600 text-white">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <Waves className="h-8 w-8" />
            <h1 className="text-xl font-bold">AquaDepth</h1>
          </div>
          <nav className="space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
                }`
              }
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </NavLink>
            <NavLink
              to="/locations"
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
                }`
              }
            >
              <MapPin className="h-5 w-5" />
              Locations
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
                }`
              }
            >
              <LineChart className="h-5 w-5" />
              Analytics
            </NavLink>
            <NavLink
              to="/predictions"
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
                }`
              }
            >
              <BrainCircuit className="h-5 w-5" />
              Predictions
            </NavLink>
            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
                }`
              }
            >
              <Bell className="h-5 w-5" />
              Alerts
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-700' : 'hover:bg-blue-700'
                }`
              }
            >
              <SettingsIcon className="h-5 w-5" />
              Settings
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
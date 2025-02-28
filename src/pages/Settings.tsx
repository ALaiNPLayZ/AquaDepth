import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Users,
  Database,
  Sliders,
  Save
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface NotificationSettings {
  email_notifications: boolean;
  sms_alerts: boolean;
}

interface AlertThresholds {
  critical_depth: number;
  sediment_warning: number;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    sms_alerts: false
  });

  const [alertThresholds, setAlertThresholds] = useState<AlertThresholds>({
    critical_depth: 45,
    sediment_warning: 12
  });

  // Simulated mutations for saving settings
  const saveNotificationSettings = async (settings: NotificationSettings) => {
    // In a real app, this would save to the database
    return new Promise(resolve => setTimeout(resolve, 500));
  };

  const saveAlertThresholds = async (thresholds: AlertThresholds) => {
    // In a real app, this would save to the database
    return new Promise(resolve => setTimeout(resolve, 500));
  };

  const notificationMutation = useMutation({
    mutationFn: saveNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const thresholdsMutation = useMutation({
    mutationFn: saveAlertThresholds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const handleNotificationChange = (setting: keyof NotificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    };
    setNotificationSettings(newSettings);
    notificationMutation.mutate(newSettings);
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAlertThresholds(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleThresholdSave = () => {
    thresholdsMutation.mutate(alertThresholds);
  };

  const handleDataExport = async () => {
    try {
      const { data: readings, error: readingsError } = await supabase
        .from('depth_readings')
        .select('*')
        .order('created_at', { ascending: false });

      if (readingsError) throw readingsError;

      const csvContent = [
        ['Time', 'Depth (m)', 'Sediment (m)', 'Temperature (°C)', 'Turbidity (NTU)'],
        ...readings.map(reading => [
          new Date(reading.created_at).toISOString(),
          reading.depth.toFixed(2),
          reading.sediment_level.toFixed(2),
          reading.temperature.toFixed(1),
          reading.turbidity.toFixed(1)
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aquadepth-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive alerts via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notificationSettings.email_notifications}
                  onChange={() => handleNotificationChange('email_notifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">SMS Alerts</h3>
                <p className="text-sm text-gray-500">Receive critical alerts via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notificationSettings.sms_alerts}
                  onChange={() => handleNotificationChange('sms_alerts')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Alert Thresholds</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Critical Depth Threshold (m)
              </label>
              <input
                type="number"
                name="critical_depth"
                value={alertThresholds.critical_depth}
                onChange={handleThresholdChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter depth threshold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sediment Warning Level (m)
              </label>
              <input
                type="number"
                name="sediment_warning"
                value={alertThresholds.sediment_warning}
                onChange={handleThresholdChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter sediment threshold"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleThresholdSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Save className="h-5 w-5" />
                Save Thresholds
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Two-Factor Authentication
              </label>
              <button 
                onClick={() => alert('2FA setup will be implemented in a future update')}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable 2FA
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                API Access Tokens
              </label>
              <button 
                onClick={() => alert('API token management will be implemented in a future update')}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Tokens
              </button>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => alert('Team management will be implemented in a future update')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Team Members
            </button>
            <button 
              onClick={() => alert('Access control will be implemented in a future update')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Access Control
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleDataExport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export All Data
              </button>
              <button 
                onClick={() => alert('Backup settings will be implemented in a future update')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Backup Settings
              </button>
              <button 
                onClick={() => alert('Data retention settings will be implemented in a future update')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Data Retention
              </button>
              <button 
                onClick={() => alert('Data archiving will be implemented in a future update')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Archive Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
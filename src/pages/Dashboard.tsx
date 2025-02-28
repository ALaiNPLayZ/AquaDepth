import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Droplets,
  LineChart,
  AlertTriangle,
  Map,
  History,
  ThermometerSun,
  Droplet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, subHours } from 'date-fns';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Dashboard = () => {
  // Get latest readings
  const { data: latestReadings } = useQuery({
    queryKey: ['latestReadings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depth_readings')
        .select('*, monitoring_locations(*)')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get active alerts
  const { data: alerts } = useQuery({
    queryKey: ['activeAlerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Get historical data for the last 24 hours
  const { data: historicalData } = useQuery({
    queryKey: ['historicalData'],
    queryFn: async () => {
      const twentyFourHoursAgo = subHours(new Date(), 24);
      
      const { data, error } = await supabase
        .from('depth_readings')
        .select('created_at, depth, sediment_level')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Process data for the chart
      return data.map(reading => ({
        ...reading,
        time: format(new Date(reading.created_at), 'HH:mm'),
        depth: Number(reading.depth.toFixed(2)),
        sediment_level: Number(reading.sediment_level.toFixed(2))
      }));
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Function to handle alert resolution
  const handleResolveAlert = async (alertId: number) => {
    const { error } = await supabase
      .from('alerts')
      .update({ 
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error resolving alert:', error);
    }
  };

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Depth Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Current Depth</h3>
            <Droplets className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {latestReadings?.depth?.toFixed(1) ?? 'N/A'}m
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {latestReadings ? `Last updated: ${format(new Date(latestReadings.created_at), 'HH:mm')}` : 'No data available'}
          </p>
        </div>

        {/* Sediment Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Sediment Level</h3>
            <LineChart className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {latestReadings?.sediment_level?.toFixed(1) ?? 'N/A'}m
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Critical threshold: {latestReadings?.monitoring_locations?.critical_sediment_level ?? 'N/A'}m
          </p>
        </div>

        {/* Temperature Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Temperature</h3>
            <ThermometerSun className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {latestReadings?.temperature?.toFixed(1) ?? 'N/A'}°C
          </p>
          <p className="text-sm text-gray-500 mt-2">Normal range: 10°C - 25°C</p>
        </div>

        {/* Turbidity Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Turbidity</h3>
            <Droplet className="h-6 w-6 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-cyan-600">
            {latestReadings?.turbidity?.toFixed(1) ?? 'N/A'} NTU
          </p>
          <p className="text-sm text-gray-500 mt-2">Clear water: {'<'} 5 NTU</p>
        </div>
      </div>

      {/* Charts and Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Data Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">24h Depth Trend</h3>
            <History className="h-6 w-6 text-gray-500" />
          </div>
          <div className="h-80">
            {historicalData && historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time"
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="depth" 
                    stroke="#2563eb" 
                    name="Depth (m)"
                    dot={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="sediment_level" 
                    stroke="#f97316" 
                    name="Sediment (m)"
                    dot={false}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No historical data available
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Active Alerts</h3>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-3">
            {alerts && alerts.length > 0 ? (
              alerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-md ${
                    alert.severity === 'critical' 
                      ? 'bg-red-100 text-red-700' 
                      : alert.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm mt-1">
                        {format(new Date(alert.created_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-2 py-1 text-sm rounded-md bg-white bg-opacity-50 hover:bg-opacity-75 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Droplets,
  LineChart,
  AlertTriangle,
  Map,
  History,
  ThermometerSun,
  Droplet,
  Gauge,
  Battery,
  Signal
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
import { setupRealtimeSubscription } from '../lib/sensorProcessing';

const Dashboard = () => {
  const [showRawData, setShowRawData] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any>(null);

  // Get latest readings
  const { data: latestReadings } = useQuery({
    queryKey: ['latestReadings', showRawData],
    queryFn: async () => {
      const table = showRawData ? 'sensor_raw_data' : 'sensor_processed_data';
      const { data, error } = await supabase
        .from(table)
        .select('*, monitoring_locations(*)')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
    refetchInterval: 30000
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
    queryKey: ['historicalData', showRawData],
    queryFn: async () => {
      const twentyFourHoursAgo = subHours(new Date(), 24);
      const table = showRawData ? 'sensor_raw_data' : 'sensor_processed_data';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return data.map(reading => ({
        ...reading,
        time: format(new Date(reading.created_at), 'HH:mm'),
        depth: Number((showRawData ? reading.raw_depth : reading.depth).toFixed(2)),
        sediment_level: Number((showRawData ? reading.raw_turbidity : reading.sediment_level).toFixed(2)),
        temperature: Number((showRawData ? reading.raw_temperature : reading.temperature).toFixed(1))
      }));
    },
    refetchInterval: 300000
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!latestReadings?.sensor_id) return;

    const unsubscribe = setupRealtimeSubscription(
      latestReadings.sensor_id,
      (data) => setRealtimeData(data)
    );

    return () => {
      unsubscribe();
    };
  }, [latestReadings?.sensor_id]);

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

  // Get the current readings, either from realtime updates or latest query
  const currentReadings = realtimeData || latestReadings;

  return (
    <div className="p-6">
      {/* Data Type Toggle */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Data Type:</span>
          <button
            onClick={() => setShowRawData(!showRawData)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showRawData
                ? 'bg-orange-100 text-orange-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {showRawData ? 'Raw Sensor Data' : 'Processed Data'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Depth Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {showRawData ? 'Raw Depth' : 'Calibrated Depth'}
            </h3>
            <Droplets className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {showRawData
              ? currentReadings?.raw_depth?.toFixed(1)
              : currentReadings?.depth?.toFixed(1) ?? 'N/A'}m
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {currentReadings
              ? `Last updated: ${format(new Date(currentReadings.created_at), 'HH:mm')}`
              : 'No data available'}
          </p>
          {!showRawData && currentReadings?.is_outlier && (
            <p className="text-sm text-orange-600 mt-1">⚠️ Possible outlier detected</p>
          )}
        </div>

        {/* Sediment/Turbidity Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {showRawData ? 'Raw Turbidity' : 'Sediment Level'}
            </h3>
            <LineChart className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {showRawData
              ? currentReadings?.raw_turbidity?.toFixed(1)
              : currentReadings?.sediment_level?.toFixed(1) ?? 'N/A'}
            {showRawData ? ' NTU' : 'm'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Critical threshold: {currentReadings?.monitoring_locations?.critical_sediment_level ?? 'N/A'}m
          </p>
        </div>

        {/* Temperature Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {showRawData ? 'Raw Temperature' : 'Processed Temperature'}
            </h3>
            <ThermometerSun className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {showRawData
              ? currentReadings?.raw_temperature?.toFixed(1)
              : currentReadings?.temperature?.toFixed(1) ?? 'N/A'}°C
          </p>
          <p className="text-sm text-gray-500 mt-2">Normal range: 10°C - 25°C</p>
        </div>

        {/* Sensor Health Card */}
        {showRawData ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Sensor Health</h3>
              <Gauge className="h-6 w-6 text-purple-500" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Battery</span>
                  <Battery className="h-4 w-4 text-green-500" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 rounded-full h-2"
                    style={{ width: `${currentReadings?.battery_level ?? 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Signal</span>
                  <Signal className="h-4 w-4 text-blue-500" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 rounded-full h-2"
                    style={{ width: `${currentReadings?.signal_strength ?? 0}%` }}
                  />
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Voltage: </span>
                <span className="text-sm font-medium text-gray-900">
                  {currentReadings?.voltage?.toFixed(1) ?? 'N/A'}V
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Data Quality</h3>
              <Gauge className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {(currentReadings?.quality_score * 100)?.toFixed(1) ?? 'N/A'}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Processing: {currentReadings?.processing_method ?? 'N/A'}
            </p>
          </div>
        )}
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
                    name={showRawData ? 'Raw Depth (m)' : 'Processed Depth (m)'}
                    dot={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="sediment_level" 
                    stroke="#f97316" 
                    name={showRawData ? 'Raw Turbidity (NTU)' : 'Sediment Level (m)'}
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
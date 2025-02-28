import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart as LineChartIcon,
  Calendar,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, subDays } from 'date-fns';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitoring_locations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', timeRange, selectedLocation],
    queryFn: async () => {
      const daysAgo = parseInt(timeRange);
      const startDate = subDays(new Date(), daysAgo).toISOString();

      const query = supabase
        .from('depth_readings')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at');

      if (selectedLocation) {
        query.eq('location_id', selectedLocation);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.map(reading => ({
        ...reading,
        time: format(new Date(reading.created_at), 'MMM d, HH:mm')
      }));
    }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="1">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <select
            value={selectedLocation || ''}
            onChange={(e) => setSelectedLocation(e.target.value ? parseInt(e.target.value) : null)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {locations?.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

          <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Download className="h-5 w-5" />
            Export Data
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depth Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Depth Trends</h2>
            <LineChartIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="depth" 
                  stroke="#2563eb" 
                  name="Depth (m)"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sediment Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Sediment Analysis</h2>
            <Calendar className="h-6 w-6 text-orange-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sediment_level" 
                  stroke="#f97316" 
                  name="Sediment (m)"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Temperature Trends</h2>
            <Calendar className="h-6 w-6 text-red-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#dc2626" 
                  name="Temperature (°C)"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Turbidity Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Turbidity Analysis</h2>
            <Calendar className="h-6 w-6 text-cyan-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="turbidity" 
                  stroke="#0891b2" 
                  name="Turbidity (NTU)"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

const severityIcons = {
  critical: <AlertTriangle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  info: <AlertCircle className="h-5 w-5 text-blue-500" />
};

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200'
};

const Alerts = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const { data: alerts } = useQuery({
    queryKey: ['alerts', filter, severityFilter],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select('*, monitoring_locations(name)')
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('resolved', false);
      } else if (filter === 'resolved') {
        query = query.eq('resolved', true);
      }

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Alert Management</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-gray-700">Filters:</span>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'resolved')}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Alerts</option>
            <option value="active">Active Only</option>
            <option value="resolved">Resolved Only</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts?.map(alert => (
                <tr key={alert.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {severityIcons[alert.severity as keyof typeof severityIcons]}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        severityColors[alert.severity as keyof typeof severityColors]
                      }`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{alert.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {alert.monitoring_locations?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(alert.created_at), 'MMM d, HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {alert.resolved ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="ml-2 text-sm text-gray-900">Resolved</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="ml-2 text-sm text-gray-900">Active</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
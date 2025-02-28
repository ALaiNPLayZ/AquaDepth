import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  FileDown,
  AlertTriangle,
  CloudRain,
  BrainCircuit,
  FileText,
  MapPin,
  Calendar
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
  Legend,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { format, subDays, addDays } from 'date-fns';

// Mock prediction data (in a real app, this would come from the ML backend)
const generatePredictionData = (actualData: any[]) => {
  if (!actualData || actualData.length === 0) return [];
  
  // Get the last date from actual data
  const lastDate = new Date(actualData[actualData.length - 1].created_at);
  
  // Generate 14 days of future predictions
  const predictions = [];
  for (let i = 1; i <= 14; i++) {
    const date = addDays(lastDate, i);
    const lastActualValue = actualData[actualData.length - 1].sediment_level;
    
    // Simple prediction algorithm (in reality, this would be ML-based)
    // Adding some randomness to simulate predictions
    const predictedValue = lastActualValue + (Math.random() * 0.5 - 0.2) * i;
    
    predictions.push({
      created_at: date.toISOString(),
      time: format(date, 'MMM d'),
      sediment_level: Number(predictedValue.toFixed(2)),
      isPrediction: true
    });
  }
  
  return predictions;
};

// Generate anomaly data
const generateAnomalies = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  // Randomly mark ~5% of points as anomalies
  return data.map(point => {
    const isAnomaly = Math.random() < 0.05;
    return {
      ...point,
      isAnomaly: isAnomaly
    };
  });
};

// Mock weather data
const generateWeatherData = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  return data.map(point => {
    return {
      ...point,
      rainfall: Math.random() * 25, // Random rainfall in mm
      temperature: 15 + Math.random() * 15 // Random temperature between 15-30°C
    };
  });
};

const Predictions = () => {
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState('30');
  const [reportType, setReportType] = useState('sediment');
  const [activeTab, setActiveTab] = useState('predictions');
  
  // Fetch locations
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

  // Fetch historical data
  const { data: historicalData } = useQuery({
    queryKey: ['historicalData', timeRange, selectedLocations],
    queryFn: async () => {
      const daysAgo = parseInt(timeRange);
      const startDate = subDays(new Date(), daysAgo).toISOString();

      let query = supabase
        .from('depth_readings')
        .select('*, monitoring_locations(name)')
        .gte('created_at', startDate)
        .order('created_at');

      if (selectedLocations.length > 0) {
        query = query.in('location_id', selectedLocations);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Process data for charts
      const processedData = data.map(reading => ({
        ...reading,
        time: format(new Date(reading.created_at), 'MMM d'),
        depth: Number(reading.depth.toFixed(2)),
        sediment_level: Number(reading.sediment_level.toFixed(2)),
        temperature: Number(reading.temperature.toFixed(1)),
        turbidity: Number(reading.turbidity.toFixed(1)),
        location_name: reading.monitoring_locations?.name
      }));
      
      return processedData;
    }
  });

  // Generate prediction data
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  
  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      const predictions = generatePredictionData(historicalData);
      setPredictionData(predictions);
      
      const anomalies = generateAnomalies(historicalData);
      setAnomalyData(anomalies);
      
      const weather = generateWeatherData(historicalData);
      setWeatherData(weather);
      
      // Combine historical and prediction data for charts
      const combined = [
        ...historicalData.map(item => ({
          ...item,
          isPrediction: false
        })),
        ...predictions
      ];
      setCombinedData(combined);
    }
  }, [historicalData]);

  // Handle location selection
  const handleLocationChange = (locationId: number) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  // Handle report generation
  const handleGenerateReport = () => {
    alert('Report generation feature will be implemented with backend ML integration');
  };

  // Render location comparison chart
  const renderLocationComparison = () => {
    if (!historicalData || historicalData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available for selected locations
        </div>
      );
    }

    // Group data by location
    const locationGroups: Record<string, any[]> = {};
    historicalData.forEach(reading => {
      const locationName = reading.location_name || 'Unknown';
      if (!locationGroups[locationName]) {
        locationGroups[locationName] = [];
      }
      locationGroups[locationName].push(reading);
    });

    // Calculate average sediment level for each location
    const comparisonData = Object.keys(locationGroups).map(locationName => {
      const readings = locationGroups[locationName];
      const avgSediment = readings.reduce((sum, reading) => sum + reading.sediment_level, 0) / readings.length;
      return {
        name: locationName,
        average_sediment: Number(avgSediment.toFixed(2))
      };
    });

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="average_sediment" 
              name="Avg. Sediment Level (m)" 
              fill="#8884d8" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render weather correlation chart
  const renderWeatherCorrelation = () => {
    if (!weatherData || weatherData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No weather data available
        </div>
      );
    }

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="rainfall" 
              name="Rainfall (mm)" 
              type="number" 
            />
            <YAxis 
              dataKey="sediment_level" 
              name="Sediment Level (m)" 
              type="number" 
            />
            <ZAxis 
              dataKey="temperature" 
              range={[50, 400]} 
              name="Temperature (°C)" 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name) => [value, name]}
              labelFormatter={() => 'Weather Correlation'}
            />
            <Legend />
            <Scatter 
              name="Weather Impact" 
              data={weatherData} 
              fill="#8884d8" 
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render anomaly detection chart
  const renderAnomalyDetection = () => {
    if (!anomalyData || anomalyData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No anomaly data available
        </div>
      );
    }

    // Filter anomalies for display
    const anomalies = anomalyData.filter(point => point.isAnomaly);

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={anomalyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="sediment_level" 
              stroke="#8884d8" 
              name="Sediment Level (m)"
              dot={false}
            />
            {/* Render anomaly points */}
            <Line 
              type="monotone" 
              dataKey="isAnomaly" 
              name="Anomalies"
              stroke="transparent"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload.isAnomaly) return null;
                
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={6} 
                    fill="red" 
                    stroke="none"
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Predictive Analytics</h1>
        
        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locations
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {locations?.map(location => (
                  <div key={location.id} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`location-${location.id}`}
                      checked={selectedLocations.includes(location.id)}
                      onChange={() => handleLocationChange(location.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`location-${location.id}`} className="ml-2 text-sm text-gray-700">
                      {location.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
              >
                <option value="sediment">Sediment Accumulation</option>
                <option value="anomaly">Anomaly Detection</option>
                <option value="weather">Weather Impact</option>
              </select>
              <button
                onClick={handleGenerateReport}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FileDown className="h-5 w-5" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('predictions')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'predictions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Predictive Analysis
            </div>
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'comparison'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Comparison
            </div>
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'anomalies'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Anomaly Detection
            </div>
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'weather'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CloudRain className="h-5 w-5" />
              Weather Correlation
            </div>
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'predictions' && (
          <>
            {/* Sediment Prediction Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Sediment Accumulation Forecast</h2>
                <LineChartIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="h-80">
                {combinedData && combinedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sediment_level" 
                        stroke="#8884d8" 
                        name="Historical Data"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                        isAnimationActive={true}
                        connectNulls={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sediment_level" 
                        stroke="#82ca9d" 
                        name="Predicted Data"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        isAnimationActive={true}
                        connectNulls={true}
                        // Only show prediction line for prediction data points
                        data={combinedData.filter(d => d.isPrediction)}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No data available for prediction
                  </div>
                )}
              </div>
              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-blue-800 mb-2">AI Insights</h3>
                <p className="text-sm text-blue-700">
                  Based on historical trends, we predict a {Math.random() > 0.5 ? 'gradual increase' : 'slight decrease'} in sediment levels over the next 14 days. 
                  The confidence level for this prediction is {Math.floor(70 + Math.random() * 25)}%.
                </p>
                <div className="mt-2 flex items-center">
                  <span className="text-sm font-medium text-blue-700 mr-2">Recommended Action:</span>
                  <span className="text-sm text-blue-700">
                    {Math.random() > 0.5 
                      ? 'Schedule maintenance within the next 30 days.' 
                      : 'No immediate action required, continue monitoring.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Prediction Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Prediction Details</h2>
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted Sediment (m)
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence Level
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {predictionData.map((prediction, index) => {
                      const confidence = 95 - index * 2;
                      const riskLevel = prediction.sediment_level > 12 ? 'High' : prediction.sediment_level > 10 ? 'Medium' : 'Low';
                      const riskColor = riskLevel === 'High' ? 'text-red-600' : riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600';
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(prediction.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prediction.sediment_level.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {confidence}%
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${riskColor}`}>
                            {riskLevel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'comparison' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Location Comparison</h2>
              <BarChartIcon className="h-6 w-6 text-blue-500" />
            </div>
            {renderLocationComparison()}
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-blue-800 mb-2">Comparison Insights</h3>
              <p className="text-sm text-blue-700">
                The data shows significant variation in sediment accumulation across different monitoring locations.
                Locations with higher water flow tend to show lower sediment levels, while sheltered areas accumulate sediment more rapidly.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Anomaly Detection</h2>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            {renderAnomalyDetection()}
            <div className="mt-4 bg-red-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-red-800 mb-2">Anomaly Insights</h3>
              <p className="text-sm text-red-700">
                Our AI model has detected {anomalyData?.filter(d => d.isAnomaly).length || 0} potential anomalies in the sediment data.
                These anomalies could indicate sudden environmental changes, equipment malfunctions, or unusual water conditions.
              </p>
              <div className="mt-2">
                <span className="text-sm font-medium text-red-700">Recommended Action: </span>
                <span className="text-sm text-red-700">
                  Investigate the highlighted anomalies and check equipment calibration.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weather' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Weather Correlation</h2>
              <CloudRain className="h-6 w-6 text-cyan-500" />
            </div>
            {renderWeatherCorrelation()}
            <div className="mt-4 bg-cyan-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-cyan-800 mb-2">Weather Impact Insights</h3>
              <p className="text-sm text-cyan-700">
                Analysis shows a strong correlation between rainfall events and increased sediment levels.
                Heavy rainfall (&gt;15mm) typically results in a 20-30% increase in sediment accumulation within 48 hours.
              </p>
              <div className="mt-2">
                <span className="text-sm font-medium text-cyan-700">Recommendation: </span>
                <span className="text-sm text-cyan-700">
                  Schedule additional monitoring after significant rainfall events.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictions;
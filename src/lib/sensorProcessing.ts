import { Database } from './database.types';
import { supabase } from './supabase';

// Types for sensor data
interface RawSensorData {
  raw_depth: number;
  raw_turbidity: number;
  raw_temperature: number;
  voltage: number;
  battery_level: number;
  signal_strength: number;
}

interface ProcessedSensorData {
  depth: number;
  turbidity: number;
  temperature: number;
  sediment_level: number;
  quality_score: number;
  is_outlier: boolean;
}

// Moving Average Filter implementation
class MovingAverageFilter {
  private windowSize: number;
  private values: number[];

  constructor(windowSize: number) {
    this.windowSize = windowSize;
    this.values = [];
  }

  process(value: number): number {
    this.values.push(value);
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }
}

// Z-score outlier detection
function isOutlier(value: number, mean: number, stdDev: number, threshold = 3): boolean {
  return Math.abs((value - mean) / stdDev) > threshold;
}

// Calculate statistics for a series of values
function calculateStats(values: number[]): { mean: number; stdDev: number } {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) };
}

// Simulate realistic sensor noise
export function addSensorNoise(value: number, noiseFactor = 0.02): number {
  // Add Gaussian noise
  const noise = Array.from({ length: 6 }, () => Math.random() - 0.5).reduce((a, b) => a + b, 0);
  return value * (1 + noiseFactor * noise);
}

// Generate synthetic sensor data with realistic patterns
export function generateRealisticSensorData(baseValues: {
  depth: number;
  turbidity: number;
  temperature: number;
}): RawSensorData {
  // Add noise and daily patterns
  const hourOfDay = new Date().getHours();
  const dailyFactor = Math.sin((hourOfDay / 24) * 2 * Math.PI);

  return {
    raw_depth: addSensorNoise(baseValues.depth * (1 + 0.05 * dailyFactor)),
    raw_turbidity: addSensorNoise(baseValues.turbidity * (1 + 0.1 * dailyFactor)),
    raw_temperature: addSensorNoise(baseValues.temperature + 2 * dailyFactor),
    voltage: addSensorNoise(12, 0.01), // 12V system with 1% noise
    battery_level: addSensorNoise(85 + 5 * dailyFactor, 0.005), // Battery level with daily pattern
    signal_strength: addSensorNoise(90 - 5 * Math.abs(dailyFactor), 0.02), // Signal strength with daily pattern
  };
}

// Process raw sensor data
export async function processSensorData(
  rawData: RawSensorData,
  sensorId: number
): Promise<ProcessedSensorData> {
  // Get calibration parameters
  const { data: calibrationData } = await supabase
    .from('sensor_calibration')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('created_at', { ascending: false })
    .limit(1);

  const calibration = calibrationData?.[0] || {
    offset_value: 0,
    scale_factor: 1,
  };

  // Initialize filters
  const depthFilter = new MovingAverageFilter(5);
  const turbidityFilter = new MovingAverageFilter(5);
  const temperatureFilter = new MovingAverageFilter(3);

  // Apply moving average filter and calibration
  const filteredDepth = depthFilter.process(rawData.raw_depth);
  const calibratedDepth = filteredDepth * calibration.scale_factor + calibration.offset_value;

  const filteredTurbidity = turbidityFilter.process(rawData.raw_turbidity);
  const filteredTemperature = temperatureFilter.process(rawData.raw_temperature);

  // Calculate sediment level based on turbidity and depth
  const sedimentLevel = (filteredTurbidity * 0.8) + (calibratedDepth * 0.2);

  // Calculate quality score based on signal strength and battery level
  const qualityScore = Math.min(
    1,
    (rawData.signal_strength / 100) * 0.7 + (rawData.battery_level / 100) * 0.3
  );

  // Check for outliers
  const { mean, stdDev } = calculateStats([filteredDepth, rawData.raw_depth]);
  const isDepthOutlier = isOutlier(rawData.raw_depth, mean, stdDev);

  return {
    depth: calibratedDepth,
    turbidity: filteredTurbidity,
    temperature: filteredTemperature,
    sediment_level: sedimentLevel,
    quality_score: qualityScore,
    is_outlier: isDepthOutlier,
  };
}

// Store sensor data
export async function storeSensorData(
  rawData: RawSensorData,
  processedData: ProcessedSensorData,
  sensorId: number
): Promise<void> {
  // Store raw data
  const { data: rawDataRecord, error: rawError } = await supabase
    .from('sensor_raw_data')
    .insert([
      {
        sensor_id: sensorId,
        ...rawData,
      },
    ])
    .select()
    .single();

  if (rawError) throw rawError;

  // Store processed data
  const { error: processedError } = await supabase
    .from('sensor_processed_data')
    .insert([
      {
        raw_reading_id: rawDataRecord.id,
        sensor_id: sensorId,
        ...processedData,
        processing_method: 'moving_average',
      },
    ]);

  if (processedError) throw processedError;
}

// WebSocket connection for real-time updates
export function setupRealtimeSubscription(
  sensorId: number,
  onData: (data: ProcessedSensorData) => void
): () => void {
  const subscription = supabase
    .channel(`sensor-${sensorId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_processed_data',
        filter: `sensor_id=eq.${sensorId}`,
      },
      (payload) => {
        onData(payload.new as ProcessedSensorData);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { Database } from '../lib/database.types';
import { mean, standardDeviation } from 'simple-statistics';

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper functions for generating realistic sensor data
function addNoise(value: number, noiseFactor = 0.02): number {
  const noise = Array.from({ length: 6 }, () => Math.random() - 0.5).reduce((a, b) => a + b, 0);
  return value * (1 + noiseFactor * noise);
}

function generateSensorData(baseValues: {
  depth: number;
  turbidity: number;
  temperature: number;
}, timestamp: Date) {
  const hourOfDay = timestamp.getHours();
  const dailyFactor = Math.sin((hourOfDay / 24) * 2 * Math.PI);

  return {
    raw_depth: addNoise(baseValues.depth * (1 + 0.05 * dailyFactor)),
    raw_turbidity: addNoise(baseValues.turbidity * (1 + 0.1 * dailyFactor)),
    raw_temperature: addNoise(baseValues.temperature + 2 * dailyFactor),
    voltage: addNoise(12, 0.01),
    battery_level: addNoise(85 + 5 * dailyFactor, 0.005),
    signal_strength: addNoise(90 - 5 * Math.abs(dailyFactor), 0.02)
  };
}

function processRawData(rawData: any, calibration: any) {
  // Apply moving average and calibration
  const depth = rawData.raw_depth * calibration.scale_factor + calibration.offset_value;
  const turbidity = rawData.raw_turbidity;
  const temperature = rawData.raw_temperature;

  // Calculate sediment level based on turbidity and depth
  const sedimentLevel = (turbidity * 0.8) + (depth * 0.2);

  // Calculate quality score based on signal strength and battery level
  const qualityScore = Math.min(
    1,
    (rawData.signal_strength / 100) * 0.7 + (rawData.battery_level / 100) * 0.3
  );

  return {
    depth,
    turbidity,
    temperature,
    sediment_level: sedimentLevel,
    quality_score: qualityScore,
    is_outlier: false,
    processing_method: 'moving_average'
  };
}

async function seedSensorData() {
  try {
    console.log('Starting sensor data seeding...');

    // Get all monitoring locations
    const { data: locations, error: locationError } = await supabase
      .from('monitoring_locations')
      .select('*');

    if (locationError) {
      throw new Error(`Error fetching locations: ${locationError.message}`);
    }

    if (!locations || locations.length === 0) {
      throw new Error('No monitoring locations found');
    }

    console.log(`Found ${locations.length} monitoring locations`);

    for (const location of locations) {
      console.log(`Processing location: ${location.name}`);

      // Create calibration data
      const calibrationData = {
        sensor_id: location.id,
        parameter: 'depth',
        offset_value: Math.random() * 0.2 - 0.1,
        scale_factor: 0.98 + Math.random() * 0.04,
        last_calibration: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        next_calibration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        calibration_formula: 'value * scale_factor + offset_value'
      };

      const { error: calibrationError } = await supabase
        .from('sensor_calibration')
        .insert([calibrationData]);

      if (calibrationError) {
        throw new Error(`Error inserting calibration data: ${calibrationError.message}`);
      }

      console.log('Calibration data created');

      // Generate historical data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let currentTime = sevenDaysAgo;
      const batchSize = 100;
      let rawDataBatch = [];
      let processedDataBatch = [];

      console.log('Generating historical data...');

      while (currentTime < new Date()) {
        const baseValues = {
          depth: location.max_depth * 0.8,
          turbidity: 5 + Math.random() * 3,
          temperature: 20 + Math.random() * 5
        };

        const rawData = {
          created_at: currentTime.toISOString(),
          sensor_id: location.id,
          ...generateSensorData(baseValues, currentTime)
        };

        const processedData = {
          created_at: currentTime.toISOString(),
          sensor_id: location.id,
          ...processRawData(rawData, calibrationData)
        };

        rawDataBatch.push(rawData);
        processedDataBatch.push(processedData);

        if (rawDataBatch.length >= batchSize) {
          // Insert raw data batch
          const { error: rawError } = await supabase
            .from('sensor_raw_data')
            .insert(rawDataBatch);

          if (rawError) {
            throw new Error(`Error inserting raw data: ${rawError.message}`);
          }

          // Insert processed data batch
          const { error: processedError } = await supabase
            .from('sensor_processed_data')
            .insert(processedDataBatch);

          if (processedError) {
            throw new Error(`Error inserting processed data: ${processedError.message}`);
          }

          rawDataBatch = [];
          processedDataBatch = [];
          console.log(`Inserted batch of data for timestamp: ${currentTime.toISOString()}`);
        }

        // Advance time by 30 minutes
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
      }

      // Insert any remaining data
      if (rawDataBatch.length > 0) {
        const { error: rawError } = await supabase
          .from('sensor_raw_data')
          .insert(rawDataBatch);

        if (rawError) {
          throw new Error(`Error inserting final raw data: ${rawError.message}`);
        }

        const { error: processedError } = await supabase
          .from('sensor_processed_data')
          .insert(processedDataBatch);

        if (processedError) {
          throw new Error(`Error inserting final processed data: ${processedError.message}`);
        }
      }

      console.log(`Completed seeding data for location: ${location.name}`);
    }

    console.log('Successfully seeded all sensor data!');
  } catch (error) {
    console.error('Error seeding sensor data:', error);
    process.exit(1);
  }
}

seedSensorData();
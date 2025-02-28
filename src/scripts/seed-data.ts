import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

async function seedData() {
  // Insert monitoring locations
  const locations = [
    {
      name: 'Harbor Bay Station',
      latitude: 40.7128,
      longitude: -74.0060,
      description: 'Main harbor monitoring station',
      max_depth: 50.0,
      critical_sediment_level: 15.0
    },
    {
      name: 'River Junction Point',
      latitude: 40.7589,
      longitude: -73.9845,
      description: 'Confluence of two major waterways',
      max_depth: 35.0,
      critical_sediment_level: 12.0
    },
    {
      name: 'Coastal Marina Site',
      latitude: 40.7829,
      longitude: -73.9654,
      description: 'Marina entrance monitoring point',
      max_depth: 45.0,
      critical_sediment_level: 14.0
    }
  ];

  console.log('Inserting monitoring locations...');
  const { data: insertedLocations, error: locationError } = await supabase
    .from('monitoring_locations')
    .insert(locations)
    .select();

  if (locationError) {
    console.error('Error inserting locations:', locationError);
    return;
  }

  // Generate readings for each location
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const readings = [];
  const baseDepths = [45.0, 30.0, 40.0];
  const baseSediments = [10.0, 8.0, 11.0];

  for (let i = 0; i < insertedLocations.length; i++) {
    const locationId = insertedLocations[i].id;
    let currentTime = sevenDaysAgo;

    while (currentTime < new Date()) {
      const hour = currentTime.getHours();
      const baseTemp = 20.0 + (5 * Math.sin(hour / 12 * Math.PI));
      const baseTurbidity = 3.0 + (2 * Math.random());

      readings.push({
        created_at: currentTime.toISOString(),
        depth: baseDepths[i] + (Math.random() * 2 - 1),
        sediment_level: baseSediments[i] + (Math.random() * 0.5),
        location_id: locationId,
        temperature: baseTemp,
        turbidity: baseTurbidity
      });

      currentTime = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
    }
  }

  console.log('Inserting depth readings...');
  // Insert readings in batches to avoid request size limits
  const batchSize = 100;
  for (let i = 0; i < readings.length; i += batchSize) {
    const batch = readings.slice(i, i + batchSize);
    const { error: readingError } = await supabase
      .from('depth_readings')
      .insert(batch);

    if (readingError) {
      console.error('Error inserting readings batch:', readingError);
      return;
    }
  }

  // Insert sample alerts
  const alerts = [
    {
      message: 'High sediment accumulation detected',
      severity: 'warning',
      location_id: insertedLocations[0].id,
      resolved: false,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      message: 'Critical depth threshold exceeded',
      severity: 'critical',
      location_id: insertedLocations[1].id,
      resolved: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      message: 'Turbidity levels above normal',
      severity: 'info',
      location_id: insertedLocations[2].id,
      resolved: false,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    },
    {
      message: 'Equipment maintenance required',
      severity: 'warning',
      location_id: insertedLocations[0].id,
      resolved: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    },
    {
      message: 'Sensor calibration needed',
      severity: 'info',
      location_id: insertedLocations[1].id,
      resolved: true,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
    }
  ];

  console.log('Inserting alerts...');
  const { error: alertError } = await supabase
    .from('alerts')
    .insert(alerts);

  if (alertError) {
    console.error('Error inserting alerts:', alertError);
    return;
  }

  console.log('Sample data inserted successfully!');
}

seedData().catch(console.error);
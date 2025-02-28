/*
  # Initial Schema for Water Monitoring System

  1. New Tables
    - monitoring_locations
      - Stores information about monitoring points
      - Includes location coordinates, description, and thresholds
    - depth_readings
      - Stores sensor readings for water depth and sediment
      - Includes temperature and turbidity measurements
    - alerts
      - Stores system alerts and warnings
      - Tracks alert status and resolution

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create monitoring_locations table
CREATE TABLE monitoring_locations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  description text,
  max_depth double precision NOT NULL,
  critical_sediment_level double precision NOT NULL
);

-- Create depth_readings table
CREATE TABLE depth_readings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  depth double precision NOT NULL,
  sediment_level double precision NOT NULL,
  location_id bigint REFERENCES monitoring_locations(id),
  temperature double precision NOT NULL,
  turbidity double precision NOT NULL
);

-- Create alerts table
CREATE TABLE alerts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  message text NOT NULL,
  severity text CHECK (severity IN ('info', 'warning', 'critical')),
  location_id bigint REFERENCES monitoring_locations(id),
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE monitoring_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE depth_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to authenticated users"
  ON monitoring_locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON depth_readings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_depth_readings_location ON depth_readings(location_id);
CREATE INDEX idx_depth_readings_created_at ON depth_readings(created_at);
CREATE INDEX idx_alerts_location ON alerts(location_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
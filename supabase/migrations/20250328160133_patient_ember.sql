/*
  # Sensor Data Pipeline Tables

  1. New Tables
    - `sensor_raw_data`
      - Stores unprocessed sensor readings
      - Includes timestamp, sensor ID, and raw values
    - `sensor_processed_data`
      - Stores cleaned and processed sensor data
      - Includes calibrated and filtered values
    - `sensor_calibration`
      - Stores calibration parameters for each sensor
      - Used for raw value conversion

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create sensor_raw_data table
CREATE TABLE IF NOT EXISTS sensor_raw_data (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  sensor_id bigint REFERENCES monitoring_locations(id),
  raw_depth float,
  raw_turbidity float,
  raw_temperature float,
  voltage float,
  battery_level float,
  signal_strength float
);

-- Create sensor_processed_data table
CREATE TABLE IF NOT EXISTS sensor_processed_data (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  raw_reading_id bigint REFERENCES sensor_raw_data(id),
  sensor_id bigint REFERENCES monitoring_locations(id),
  depth float,
  turbidity float,
  temperature float,
  sediment_level float,
  quality_score float CHECK (quality_score >= 0 AND quality_score <= 1),
  is_outlier boolean DEFAULT false,
  processing_method text
);

-- Create sensor_calibration table
CREATE TABLE IF NOT EXISTS sensor_calibration (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  sensor_id bigint REFERENCES monitoring_locations(id),
  parameter text NOT NULL,
  offset_value float DEFAULT 0,
  scale_factor float DEFAULT 1,
  last_calibration timestamptz,
  next_calibration timestamptz,
  calibration_formula text
);

-- Enable RLS
ALTER TABLE sensor_raw_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_processed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_calibration ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to authenticated users"
  ON sensor_raw_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON sensor_processed_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON sensor_calibration
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_raw_data_sensor ON sensor_raw_data(sensor_id);
CREATE INDEX idx_raw_data_created ON sensor_raw_data(created_at);
CREATE INDEX idx_processed_data_sensor ON sensor_processed_data(sensor_id);
CREATE INDEX idx_processed_data_created ON sensor_processed_data(created_at);
CREATE INDEX idx_processed_data_raw ON sensor_processed_data(raw_reading_id);
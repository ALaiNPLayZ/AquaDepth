# AquaDepth Monitor - Project Report

## 1. Project Overview

AquaDepth Monitor is a sophisticated water depth and sediment monitoring system designed to provide real-time insights into water conditions. The system combines advanced sensor data processing, real-time monitoring, and predictive analytics to deliver actionable insights for water management.

### 1.1 Key Features

- Real-time water depth and sediment monitoring
- Advanced sensor data processing pipeline
- Predictive analytics for sediment accumulation
- Automated alert system for critical conditions
- Interactive data visualization
- Multi-location monitoring support
- Historical data analysis
- Weather correlation analysis
- Anomaly detection

## 2. Technical Architecture

### 2.1 Technology Stack

- **Frontend:**
  - React 18.3 with TypeScript
  - Vite for build tooling
  - TanStack Query for data management
  - Recharts for data visualization
  - Tailwind CSS for styling
  - Lucide React for icons

- **Backend:**
  - Supabase for backend services
  - PostgreSQL database
  - Real-time subscriptions via WebSocket
  - Edge Functions for serverless computing

- **Data Processing:**
  - Custom sensor data processing pipeline
  - Moving Average Filter for noise reduction
  - Z-score based outlier detection
  - Real-time data quality scoring

### 2.2 Database Schema

#### Monitoring Locations Table
```sql
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
```

#### Sensor Raw Data Table
```sql
CREATE TABLE sensor_raw_data (
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
```

#### Sensor Processed Data Table
```sql
CREATE TABLE sensor_processed_data (
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
```

#### Alerts Table
```sql
CREATE TABLE alerts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  message text NOT NULL,
  severity text CHECK (severity IN ('info', 'warning', 'critical')),
  location_id bigint REFERENCES monitoring_locations(id),
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);
```

## 3. Data Processing Pipeline

### 3.1 Sensor Data Processing

The system implements a sophisticated data processing pipeline:

1. **Raw Data Collection:**
   - Collects sensor readings for depth, turbidity, temperature
   - Monitors sensor health (voltage, battery, signal strength)
   - Applies timestamp and sensor identification

2. **Noise Reduction:**
   - Moving Average Filter implementation
   - Configurable window size for different parameters
   - Adaptive filtering based on signal characteristics

3. **Calibration:**
   - Sensor-specific calibration parameters
   - Offset and scale factor adjustments
   - Regular calibration tracking and scheduling

4. **Quality Control:**
   - Z-score based outlier detection
   - Signal quality scoring
   - Sensor health monitoring
   - Data validation checks

### 3.2 Data Processing Code Example

```typescript
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

// Process raw sensor data
async function processSensorData(rawData: RawSensorData, sensorId: number): Promise<ProcessedSensorData> {
  const depthFilter = new MovingAverageFilter(5);
  const turbidityFilter = new MovingAverageFilter(5);
  const temperatureFilter = new MovingAverageFilter(3);

  const filteredDepth = depthFilter.process(rawData.raw_depth);
  const filteredTurbidity = turbidityFilter.process(rawData.raw_turbidity);
  const filteredTemperature = temperatureFilter.process(rawData.raw_temperature);

  // Calculate quality score
  const qualityScore = Math.min(
    1,
    (rawData.signal_strength / 100) * 0.7 + (rawData.battery_level / 100) * 0.3
  );

  return {
    depth: filteredDepth,
    turbidity: filteredTurbidity,
    temperature: filteredTemperature,
    sediment_level: calculateSedimentLevel(filteredDepth, filteredTurbidity),
    quality_score: qualityScore,
    is_outlier: detectOutlier(filteredDepth, rawData.raw_depth)
  };
}
```

## 4. Features and Functionality

### 4.1 Real-time Monitoring

- Live sensor data updates via WebSocket
- Immediate alert generation for critical conditions
- Dynamic dashboard updates
- Real-time data quality monitoring

### 4.2 Predictive Analytics

- Sediment accumulation forecasting
- Anomaly detection and prediction
- Weather impact correlation analysis
- Maintenance scheduling recommendations

### 4.3 Data Visualization

- Interactive time-series charts
- Location comparison analytics
- Weather correlation scatter plots
- Sensor health monitoring displays

### 4.4 Alert System

- Multi-level severity classification
- Configurable alert thresholds
- Alert resolution tracking
- Historical alert analysis

## 5. Security Implementation

### 5.1 Database Security

- Row Level Security (RLS) enabled on all tables
- Authentication-based access control
- Secure API endpoints
- Data encryption at rest

### 5.2 Access Control

```sql
-- Example RLS Policy
CREATE POLICY "Allow read access to authenticated users"
  ON monitoring_locations
  FOR SELECT
  TO authenticated
  USING (true);
```

## 6. Performance Optimizations

### 6.1 Frontend Optimizations

- Code splitting for optimal loading
- Lazy loading of components
- Efficient state management
- Optimized re-rendering

### 6.2 Database Optimizations

```sql
-- Performance Indexes
CREATE INDEX idx_depth_readings_location ON depth_readings(location_id);
CREATE INDEX idx_depth_readings_created_at ON depth_readings(created_at);
CREATE INDEX idx_alerts_location ON alerts(location_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
```

## 7. Deployment

### 7.1 Build Configuration

```javascript
// Vite Configuration
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts', 'd3'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

### 7.2 Environment Configuration

```plaintext
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 8. Future Enhancements

### 8.1 Planned Features

- Machine learning-based predictions
- Advanced weather integration
- Mobile application development
- Extended sensor support
- Enhanced reporting capabilities

### 8.2 Scalability Considerations

- Horizontal scaling capabilities
- Multi-region deployment support
- Enhanced caching mechanisms
- Optimized data retention policies

## 9. Conclusion

AquaDepth Monitor represents a comprehensive solution for water depth and sediment monitoring, combining advanced data processing, real-time monitoring, and predictive analytics. The system's modular architecture and robust implementation provide a solid foundation for future enhancements and scaling.

## Appendix A: API Documentation

### A.1 Sensor Data API

```typescript
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
```

### A.2 Alert API

```typescript
interface Alert {
  id: number;
  created_at: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  location_id: number;
  resolved: boolean;
  resolved_at: string | null;
}
```
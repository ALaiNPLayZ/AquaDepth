export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      depth_readings: {
        Row: {
          id: number
          created_at: string
          depth: number
          sediment_level: number
          location_id: number
          temperature: number
          turbidity: number
        }
        Insert: {
          id?: number
          created_at?: string
          depth: number
          sediment_level: number
          location_id: number
          temperature: number
          turbidity: number
        }
        Update: {
          id?: number
          created_at?: string
          depth?: number
          sediment_level?: number
          location_id?: number
          temperature?: number
          turbidity?: number
        }
      }
      monitoring_locations: {
        Row: {
          id: number
          created_at: string
          name: string
          latitude: number
          longitude: number
          description: string
          max_depth: number
          critical_sediment_level: number
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          latitude: number
          longitude: number
          description: string
          max_depth: number
          critical_sediment_level: number
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          latitude?: number
          longitude?: number
          description?: string
          max_depth?: number
          critical_sediment_level?: number
        }
      }
      alerts: {
        Row: {
          id: number
          created_at: string
          message: string
          severity: 'info' | 'warning' | 'critical'
          location_id: number
          resolved: boolean
          resolved_at: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          message: string
          severity: 'info' | 'warning' | 'critical'
          location_id: number
          resolved?: boolean
          resolved_at?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          message?: string
          severity?: 'info' | 'warning' | 'critical'
          location_id?: number
          resolved?: boolean
          resolved_at?: string | null
        }
      }
      sensor_raw_data: {
        Row: {
          id: number
          created_at: string
          sensor_id: number
          raw_depth: number
          raw_turbidity: number
          raw_temperature: number
          voltage: number
          battery_level: number
          signal_strength: number
        }
        Insert: {
          id?: number
          created_at?: string
          sensor_id: number
          raw_depth: number
          raw_turbidity: number
          raw_temperature: number
          voltage: number
          battery_level: number
          signal_strength: number
        }
        Update: {
          id?: number
          created_at?: string
          sensor_id?: number
          raw_depth?: number
          raw_turbidity?: number
          raw_temperature?: number
          voltage?: number
          battery_level?: number
          signal_strength?: number
        }
      }
      sensor_processed_data: {
        Row: {
          id: number
          created_at: string
          raw_reading_id: number
          sensor_id: number
          depth: number
          turbidity: number
          temperature: number
          sediment_level: number
          quality_score: number
          is_outlier: boolean
          processing_method: string
        }
        Insert: {
          id?: number
          created_at?: string
          raw_reading_id: number
          sensor_id: number
          depth: number
          turbidity: number
          temperature: number
          sediment_level: number
          quality_score: number
          is_outlier?: boolean
          processing_method: string
        }
        Update: {
          id?: number
          created_at?: string
          raw_reading_id?: number
          sensor_id?: number
          depth?: number
          turbidity?: number
          temperature?: number
          sediment_level?: number
          quality_score?: number
          is_outlier?: boolean
          processing_method?: string
        }
      }
      sensor_calibration: {
        Row: {
          id: number
          created_at: string
          sensor_id: number
          parameter: string
          offset_value: number
          scale_factor: number
          last_calibration: string
          next_calibration: string
          calibration_formula: string
        }
        Insert: {
          id?: number
          created_at?: string
          sensor_id: number
          parameter: string
          offset_value?: number
          scale_factor?: number
          last_calibration: string
          next_calibration: string
          calibration_formula: string
        }
        Update: {
          id?: number
          created_at?: string
          sensor_id?: number
          parameter?: string
          offset_value?: number
          scale_factor?: number
          last_calibration?: string
          next_calibration?: string
          calibration_formula?: string
        }
      }
    }
  }
}
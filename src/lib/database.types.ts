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
    }
  }
}
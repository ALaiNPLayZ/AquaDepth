import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvVars() {
  // For browser environment
  if (typeof window !== 'undefined' && import.meta?.env) {
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    };
  }

  // For Node.js environment
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    return {
      supabaseUrl: envVars.VITE_SUPABASE_URL,
      supabaseKey: envVars.VITE_SUPABASE_ANON_KEY
    };
  } catch (error) {
    throw new Error('Failed to load environment variables. Make sure .env file exists.');
  }
}

const { supabaseUrl, supabaseKey } = loadEnvVars();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key must be provided in environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
import { createClient } from '@supabase/supabase-js';

// The URL and Key are expected to be injected through environment variables.
// If using Node.js without a bundler, we need 'dotenv' to read .env files.
// For now, this is a standard setup.

const supabaseUrl = process.env.SUPABASE_URL || 'TU_URL_AQUI';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'TU_CLAVE_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tzyelxvrutltxoygiety.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eWVseHZydXRsdHhveWdpZXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzY2NzAsImV4cCI6MjA4NTA1MjY3MH0.fR6wa9UA8sNobNbCYV6XGBz4d0k-QLRieDSuAYXVqhI';

const db = createClient(supabaseUrl, supabaseKey);

export default db;

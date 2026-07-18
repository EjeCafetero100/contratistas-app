import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Faltan las variables de entorno de Supabase.');
}

const db = createClient(supabaseUrl || '', supabaseKey || '');

export default db;

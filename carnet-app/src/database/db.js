import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Faltan las variables de entorno de Supabase.');
}

const dummyUrl = 'https://dummy.supabase.co';
const dummyKey = 'dummy-key';

const db = createClient(supabaseUrl || dummyUrl, supabaseKey || dummyKey);

export default db;

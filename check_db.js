import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqnmekmrwuxwqjenbnwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbm1la21yd3V4d3FqZW5ibnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjgyNDEsImV4cCI6MjEwMTE0NDI0MX0.TfNy5eh39b8BZkkDI1PyTdkcGQ8qCxB4j6Ctb9KiO-g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('Checking database...');
  const { data, error } = await supabase.from('custom_users').select('*').limit(1);
  
  if (error) {
    console.error('Database Error:', error);
  } else {
    console.log('Database Success! Data:', data);
  }
}

checkDatabase();

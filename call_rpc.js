import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqnmekmrwuxwqjenbnwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbm1la21yd3V4d3FqZW5ibnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjgyNDEsImV4cCI6MjEwMTE0NDI0MX0.TfNy5eh39b8BZkkDI1PyTdkcGQ8qCxB4j6Ctb9KiO-g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function callRpc() {
  console.log('Calling rpc setup_initial_admin...');
  const { data, error } = await supabase.rpc('setup_initial_admin', { admin_email: 'admin@society.com', admin_password: 'admin123' });
  
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success! Data:', data);
  }
}

callRpc();

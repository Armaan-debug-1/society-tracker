import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqnmekmrwuxwqjenbnwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbm1la21yd3V4d3FqZW5ibnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjgyNDEsImV4cCI6MjEwMTE0NDI0MX0.TfNy5eh39b8BZkkDI1PyTdkcGQ8qCxB4j6Ctb9KiO-g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initUser() {
  console.log('Signing up admin...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@society.com',
    password: 'admin123'
  });
  
  if (error) {
    console.error('SignUp Error:', error.message, error.status);
  } else {
    console.log('SignUp Success!', data.user?.email);
  }

  // Also insert into custom_users if necessary, though setup_initial_admin handles this via SQL.
  // Wait, if RLS is enabled, we might not be able to insert into custom_users via anon key without being authenticated.
  // Let's first just test if sign up works.
}

initUser();

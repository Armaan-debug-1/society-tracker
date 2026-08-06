const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@society.com',
    password: 'admin123'
  });
  
  if (error) {
    console.error('Login Error:', error.message, error.status);
  } else {
    console.log('Login Success!', data.user.email);
  }
}

testLogin();

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Yeh 'export' word hi missing/unsaved hoga jiski wajah se error aayi
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
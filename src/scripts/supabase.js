// Supabase Configuration
const SUPABASE_URL = 'https://ltvesfeyxyxdzyuqtrmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dmVzZmV5eHl4ZHp5dXF0cm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODE3MjksImV4cCI6MjA3NTI1NzcyOX0.7LqHe_nqNq_UEA7mi_H1DXBYeIhIg2wTjyMx-gshzBY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;

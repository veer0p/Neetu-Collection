import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pavmpakpbzdrxmqomblw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdm1wYWtwYnpkcnhtcW9tYmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTkzMjQsImV4cCI6MjA4NjM5NTMyNH0.KgVOq_5KyARO8pzTybVrUKeCE8BX4GcrRRUnQCoX62Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
});

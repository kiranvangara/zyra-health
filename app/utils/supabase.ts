import { createClient } from '@supabase/supabase-js';
import CapacitorStorage from './capacitorStorage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://isforydcyxhppjyxdlpi.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_yzDZ8ZVBtuSYRRVE2NmWdA_ME6uRMq4';

// Check if we are in the browser context
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Use native storage if available, fallback to localStorage
        storage: isBrowser ? CapacitorStorage : undefined,
    }
});

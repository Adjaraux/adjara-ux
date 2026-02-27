import { createClient } from '@supabase/supabase-js';

// ADMIN ONLY - Bypass RLS
export function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(`Supabase Admin configuration missing: URL=${!!url}, KEY=${!!key}`);
    }

    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
}

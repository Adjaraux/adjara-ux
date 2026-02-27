
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseKey) {
    console.error('Supabase Credentials Missing or Invalid. Please update .env.local');
    // On ne fait plus de "throw new Error" pour permettre au build de continuer
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);


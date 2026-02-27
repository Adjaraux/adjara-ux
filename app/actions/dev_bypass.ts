'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { addMonths } from 'date-fns';

export async function simulateDevPayment(packType: 'essentiel' | 'expert' | 'master') {
    // 1. Security Check: Only in Development
    if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_ALLOW_DEV_TOOLS !== 'true') {
        throw new Error("Action not allowed in production.");
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    // 2. Direct Upgrade (Service Role)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Missing Service Role Key");

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
    );

    let monthsToAdd = 0;
    if (packType === 'essentiel') monthsToAdd = 9;
    if (packType === 'expert') monthsToAdd = 27;
    if (packType === 'master') monthsToAdd = 36;

    const newEndDate = addMonths(new Date(), monthsToAdd).toISOString();

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            pack_type: packType,
            subscription_end: newEndDate
        })
        .eq('id', user.id);

    if (error) {
        console.error("Simulation Error", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

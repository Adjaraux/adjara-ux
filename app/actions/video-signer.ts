'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/utils/supabase-admin';

export async function signVideoUrlV2(videoPath: string) {
    // return { success: false, message: "TEST EARLY EXIT" };
    try {
        if (!videoPath) return { success: false, message: "No path" };

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Non authentifié" };

        const admin = getAdminClient();
        const bucket = 'academy_content';
        const { data, error } = await admin.storage.from(bucket).createSignedUrl(videoPath, 60 * 60);

        if (error) {
            return { success: false, message: `Storage error: ${error.message}` };
        }

        return { success: true, signedUrl: data.signedUrl };

    } catch (e: any) {
        console.error("Video Sign Context Failure:", e);
        return { success: false, message: `Action Crash: ${e.message}` };
    }
}

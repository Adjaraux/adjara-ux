'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/utils/supabase-admin';

export async function getSignedUrl(pathOrUrl: string, projectId?: string, bucketName: string = 'academy_content') {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Non authentifié" };

        let bucket = '';
        let path = '';

        if (pathOrUrl.startsWith('http')) {
            try {
                const urlObj = new URL(pathOrUrl);
                const pathParts = urlObj.pathname.split('/');
                const typeIndex = pathParts.findIndex(p => p === 'public' || p === 'sign');
                if (typeIndex !== -1 && pathParts.length > typeIndex + 2) {
                    bucket = pathParts[typeIndex + 1];
                    path = pathParts.slice(typeIndex + 2).join('/');
                    path = decodeURIComponent(path);
                } else {
                    return { success: false, message: "URL invalide format Supabase." };
                }
            } catch (e) {
                return { success: false, message: "URL invalide." };
            }
        } else {
            bucket = bucketName || 'academy_content';
            path = pathOrUrl;
        }

        const admin = getAdminClient();

        if (bucket !== 'academy_content') {
            const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'admin') {
                if (bucket === 'agency_deliverables' || bucket === 'chat_attachments') {
                    if (!projectId) return { success: false, message: "ID projet requis." };
                    const { data: project } = await admin.from('projects').select('client_id, assigned_talent_id').eq('id', projectId).single();
                    if (!project || (project.client_id !== user.id && project.assigned_talent_id !== user.id)) {
                        return { success: false, message: "Accès refusé." };
                    }
                }
            }
        }

        const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60);

        if (error) {
            return { success: false, message: `Storage error: ${error.message}` };
        }

        return { success: true, signedUrl: data.signedUrl };
    } catch (e: any) {
        console.error("Storage Sign Failure:", e);
        return { success: false, message: `Action Crash: ${e.message}` };
    }
}

export const getSignedUrlAction = getSignedUrl;

export async function getSignedUrlsV2(paths: string[], bucketName: string = 'academy_content') {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Non authentifié" };

        const admin = getAdminClient();
        const { data, error } = await admin.storage.from(bucketName).createSignedUrls(paths, 60 * 60);

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, urls: data };
    } catch (e: any) {
        console.error("Batch Storage Sign Failure:", e);
        return { success: false, message: `Action Crash: ${e.message}` };
    }
}

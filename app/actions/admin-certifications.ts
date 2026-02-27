'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/utils/supabase-admin';

export async function getAdminCertificates(limit = 50) {
    const supabase = getAdminClient();

    // Fetch Certificates with Profile Join
    // Certificates.user_id references profiles.id.
    const { data: certsWithProfiles, error: joinError } = await supabase
        .from('certificates')
        .select(`
            *,
            profile:user_id (
                email, 
                full_name, 
                pack_type, 
                specialty
            ),
            courses:course_id (title)
        `)
        .order('issued_at', { ascending: false })
        .limit(limit);

    // If join works, use it. If not (relation missing), fallback to Auth API?
    // Since I control schema, I know user_id references profiles(id).
    // Let's assume the join works if relation exists.

    if (joinError) {
        console.error("Join Error (Profiles):", joinError);
        // Fallback or Return Error
        return { success: false, error: joinError.message };
    }

    const mapped = certsWithProfiles.map((c: any) => {
        // Safe Access
        const p = c.profile; // single object
        const finalName = p?.full_name || p?.email || 'Étudiant Inconnu';

        return {
            id: c.id,
            certificate_uid: c.metadata?.certificate_id || 'N/A',
            user_name: finalName,
            user_email: p?.email || 'N/A',
            pack_type: p?.pack_type || 'Aucun',
            specialty: p?.specialty || 'Aucune',
            course_title: c.courses?.title || 'Cours Supprimé',
            final_grade: c.final_grade,
            issued_at: c.issued_at, // Matching column name
            storage_path: c.storage_path
        };
    });

    return { success: true, certificates: mapped };
}

/**
 * Fetches students who have completed a specialty but don't have a certificate record yet.
 */
export async function getEligibleStudents() {
    const supabase = getAdminClient();

    // 1. Get all profiles with a specialty
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email, specialty, pack_type')
        .not('specialty', 'eq', 'none');

    if (pError) return { success: false, error: pError.message };

    // 2. Get all certificates to exclude those who already have one
    const { data: existingCerts } = await supabase
        .from('certificates')
        .select('user_id, course_id');

    // 3. Parallelize progress checks
    const eligibleResults = await Promise.all((profiles || []).map(async (profile) => {
        // Get specialty courses
        const { data: courses } = await supabase
            .from('courses')
            .select('id, title, category')
            .eq('category', 'specialite')
            .eq('related_specialty', profile.specialty);

        if (!courses || courses.length === 0) return null;

        const courseIds = courses.map(c => c.id);

        // Check progress for these courses
        const { data: progress } = await supabase
            .rpc('get_user_course_progress', { course_ids: courseIds });

        // A user is eligible if they have 100% on ALL their specialty courses
        const allDone = courseIds.every(id => {
            const p = progress?.find((d: any) => d.course_id === id);
            return p && p.progress_percent === 100;
        });

        if (allDone) {
            // Further filter: Do they already have a certificate for the LAST course?
            const lastCourseId = courses[courses.length - 1].id;
            const alreadyHasCert = existingCerts?.some(c => c.user_id === profile.id && c.course_id === lastCourseId);

            if (!alreadyHasCert) {
                return {
                    user_id: profile.id,
                    user_name: profile.full_name || profile.email,
                    user_email: profile.email,
                    specialty: profile.specialty,
                    pack_type: profile.pack_type,
                    course_title: courses[courses.length - 1].title, // Reference course
                    course_id: lastCourseId
                };
            }
        }
        return null;
    }));

    const eligible = eligibleResults.filter(Boolean);
    return { success: true, eligible };
}

export async function getCertificateDownloadUrl(storagePath: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data } = await supabase
        .storage
        .from('certificates')
        .createSignedUrl(storagePath, 3600);

    return data?.signedUrl || null;
}

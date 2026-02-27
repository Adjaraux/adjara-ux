'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { differenceInMonths, parseISO } from 'date-fns';
import { getSignedUrlsV2 } from './storage';

export async function getAcademyData() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, subscription_start, pack_type, specialty')
        .eq('id', user.id)
        .single();

    if (!profile) return { success: false, error: "Profile not found" };

    // 2. Calculate Time
    let monthsSinceSub = 0;
    if (profile.subscription_start) {
        const start = parseISO(profile.subscription_start);
        monthsSinceSub = differenceInMonths(new Date(), start);
    }

    // 3. Get Courses
    const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('unlock_at_month', { ascending: true });

    if (!coursesData) return { success: false, error: "No courses found" };

    const courseIds = coursesData.map(c => c.id);

    // 4. Get Progress via RPC
    const { data: progressData } = await supabase
        .rpc('get_user_course_progress', { course_ids: courseIds });

    let courses = coursesData.map(c => {
        const prog = progressData?.find((p: any) => p.course_id === c.id);
        return {
            ...c,
            progressPercent: prog ? prog.progress_percent : 0
        };
    });

    //  signing Thumbnails
    const thumbnailPaths = courses
        .map(c => c.thumbnail_url)
        .filter((url): url is string => !!url && !url.startsWith('http'));

    if (thumbnailPaths.length > 0) {
        const signResult = await getSignedUrlsV2(thumbnailPaths);
        if (signResult.success && signResult.urls) {
            courses = courses.map(c => {
                const signedMatch = signResult.urls?.find(s => s.path === c.thumbnail_url);
                return {
                    ...c,
                    thumbnail_url: signedMatch ? signedMatch.signedUrl : c.thumbnail_url
                };
            });
        }
    }

    // Academy Logic Helpers
    const tcCourses = courses.filter(c => c.category === 'tronc_commun');
    const isTcComplete = tcCourses.length > 0 && tcCourses.every(c => (c.progressPercent || 0) === 100);

    const needsSpecialtySelection = isTcComplete &&
        (!profile.specialty || profile.specialty === 'none') &&
        profile.pack_type !== 'master' &&
        !!profile.pack_type;

    const isLateOnTc = monthsSinceSub >= 3 && !isTcComplete && !!profile.pack_type;
    const needsSubscription = isTcComplete && !profile.pack_type;

    // Filter and Lock
    const filteredCourses = courses.filter(course => {
        if (course.category === 'specialite') {
            if (profile.pack_type === 'master') return true;
            if (course.related_specialty && course.related_specialty !== profile.specialty) return false;
        }
        if (course.category === 'incubation' && profile.pack_type === 'essentiel') return false;
        if (course.category === 'lab' && profile.pack_type !== 'master') return false;
        return true;
    });

    const processedCourses = filteredCourses.map(course => {
        const isTimeLocked = monthsSinceSub < course.unlock_at_month;
        const isFastTrack = course.category === 'specialite' && isTcComplete && !!profile.pack_type;
        return {
            ...course,
            isLocked: isTimeLocked && !isFastTrack
        };
    });

    return {
        success: true,
        profile,
        courses: processedCourses,
        monthsSinceSub,
        needsSpecialtySelection,
        isTcComplete,
        isLateOnTc,
        needsSubscription
    };
}

/**
 * Global helper to check if TC is finished for a user.
 * Reuses the same logic as getAcademyData but faster.
 */
export async function checkUserTcCompletion(userId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: tcCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('category', 'tronc_commun');

    if (!tcCourses || tcCourses.length === 0) return { isComplete: false };

    const tcIds = tcCourses.map(c => c.id);
    const { data: progressData } = await supabase
        .rpc('get_user_course_progress', { course_ids: tcIds });

    const isComplete = tcIds.every(id => {
        const p = progressData?.find((d: any) => d.course_id === id);
        return p && p.progress_percent === 100;
    });

    return { isComplete };
}
import { revalidatePath } from 'next/cache';

export async function updateStudentSpecialtyAction(specialty: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from('profiles')
        .update({ specialty })
        .eq('id', user.id);

    if (error) {
        console.error("Error updating specialty:", error);
        return { success: false, error: error.message };
    }

    // CRITICAL: Revalidate all elève routes to reflect the change
    revalidatePath('/dashboard/eleve', 'layout');
    revalidatePath('/dashboard/eleve/learning');
    revalidatePath('/dashboard/eleve/selection-specialite');

    return { success: true };
}

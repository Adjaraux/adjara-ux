'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { differenceInMonths, parseISO } from 'date-fns';
import { usePathname } from 'next/navigation';
import { getSignedUrlsV2 } from '@/app/actions/storage';

export type Course = {
    id: string;
    title: string;
    slug: string;
    category: 'tronc_commun' | 'specialite' | 'incubation' | 'lab';
    related_specialty: 'textile' | 'gravure' | 'digital' | null;
    unlock_at_month: number;
    description: string;
    thumbnail_url: string | null;
    progressPercent?: number;
};

export type StudentProfile = {
    id: string;
    subscription_start: string | null;
    pack_type: 'essentiel' | 'expert' | 'master' | null;
    specialty: 'textile' | 'gravure' | 'digital' | 'none';
};

export const useAcademyLogic = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [monthsSinceSub, setMonthsSinceSub] = useState(0);
    const pathname = usePathname(); // Trigger re-fetch on navigation

    const [supabase] = useState(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ));

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get User
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 2. Get Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, subscription_start, pack_type, specialty')
                    .eq('id', user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData as StudentProfile);
                    // Calculate Time-Lock
                    if (profileData.subscription_start) {
                        const start = parseISO(profileData.subscription_start);
                        const months = differenceInMonths(new Date(), start);
                        setMonthsSinceSub(months);
                    }
                }

                // 3. Get Courses
                const { data: coursesData } = await supabase
                    .from('courses')
                    .select('*')
                    .order('unlock_at_month', { ascending: true });

                let coursesWithProgress: (Course & { progressPercent?: number })[] = [];

                if (coursesData) {
                    const courseIds = coursesData.map(c => c.id);
                    // 4. Get Progress via RPC
                    const { data: progressData } = await supabase
                        .rpc('get_user_course_progress', { course_ids: courseIds });

                    coursesWithProgress = coursesData.map(c => {
                        const prog = progressData?.find((p: any) => p.course_id === c.id);
                        return {
                            ...c,
                            progressPercent: prog ? prog.progress_percent : 0
                        };
                    });

                    // 5. Batch Sign Thumbnails
                    const thumbnailPaths = coursesWithProgress
                        .map(c => c.thumbnail_url)
                        .filter((url): url is string => !!url && !url.startsWith('http'));

                    if (thumbnailPaths.length > 0) {
                        const signResult = await getSignedUrlsV2(thumbnailPaths);
                        if (signResult && signResult.success && signResult.urls) {
                            coursesWithProgress = coursesWithProgress.map(c => {
                                const signedMatch = signResult.urls?.find((s: any) => s.path === c.thumbnail_url);
                                return {
                                    ...c,
                                    thumbnail_url: signedMatch ? signedMatch.signedUrl : c.thumbnail_url
                                };
                            });
                        }
                    }
                }

                setCourses(coursesWithProgress);

            } catch (error) {
                console.error('Academy Logic Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pathname]); // Re-run when path changes (essential for updating profile state after edits)

    // The Filter Logic
    const filteredCourses = courses.filter(course => {
        if (!profile) return false;

        // 1. Time Rule
        // OPTION: We can show them as "Locked" instead of hiding them. 
        // For now, let's keep them visible but we will add a 'isLocked' property in UI.

        // 2. Specialty Rule
        if (course.category === 'specialite') {
            if (profile.pack_type === 'master') return true; // Master sees all
            if (course.related_specialty && course.related_specialty !== profile.specialty) return false;
        }

        // 3. Incubation/Lab Rule
        if (course.category === 'incubation' && profile.pack_type === 'essentiel') return false;
        if (course.category === 'lab' && profile.pack_type !== 'master') return false;

        return true;
    });

    const tcCourses = courses.filter(c => c.category === 'tronc_commun');
    const isTcComplete = tcCourses.length > 0 && tcCourses.every(c => (c.progressPercent || 0) === 100);

    // NOTIFICATION LOGIC
    const needsSpecialtySelection = isTcComplete &&
        (profile?.specialty === 'none' || !profile?.specialty) &&
        profile?.pack_type !== 'master' &&
        !!profile?.pack_type;

    // LATE ALERT LOGIC (Motivational)
    // If user has been here for 3 months or more AND Tronc Commun is not done.
    const isLateOnTc = monthsSinceSub >= 3 && !isTcComplete && !!profile?.pack_type;

    // Apply Locking Logic (Time + Fast Track)
    const processedCourses = filteredCourses.map(course => {
        const isTimeLocked = monthsSinceSub < course.unlock_at_month;

        // Fast Track: If it's a specialty, TC is done, and user has paid => UNLOCK regardless of time
        const isFastTrack = course.category === 'specialite' && isTcComplete && !!profile?.pack_type;

        return {
            ...course,
            isLocked: isTimeLocked && !isFastTrack
        };
    });

    // SPECIALTY COMPLETION LOGIC (For Diploma) 🎓
    const specialtyCourses = courses.filter(c =>
        c.category === 'specialite' &&
        profile?.specialty &&
        c.related_specialty === profile.specialty
    );

    // Check if ALL specialty courses are 100% completed
    const isSpecialtyComplete = specialtyCourses.length > 0 && specialtyCourses.every(c => (c.progressPercent || 0) === 100);

    return {
        profile,
        courses: processedCourses,
        loading,
        monthsSinceSub,
        needsSpecialtySelection,
        isTcComplete,
        isLateOnTc,
        isSpecialtyComplete,
        specialtyCourses
    };
};

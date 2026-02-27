import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { differenceInMonths, parseISO } from 'date-fns';
import { CourseViewer } from '@/components/course/course-viewer';
import { checkAccess } from '@/lib/access';
import { checkUserTcCompletion } from '@/app/actions/academy';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function CoursePage({ params }: PageProps) {
    const { slug } = await params;
    const cookieStore = await cookies();

    // 1. Server-Side Supabase Client (Secure)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    // We are reading only, but this satisfies the interface
                },
            },
        }
    );

    // 2. Validate User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    // 3. Get User Profile & Subscription
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_start, pack_type, specialty, created_at, subscription_end')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/welcome'); // Should not happen if middleware works
    }

    // 4. Get Course Data
    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!course) {
        notFound();
    }

    // 5. ACCESS CONTROL (Monetization & Trial)
    // We check if the user is allowed to view this course based on Pack or Trial
    const access = checkAccess(profile as any, course.category, course.related_specialty);

    if (!access.allowed) {
        // Redirect to Upgrade Page with reason
        // e.g. /pricing?reason=expired or /pricing?reason=locked_pack
        redirect(`/pricing?reason=${access.reason}&course=${course.id}`);
    }

    // BUSINESS RULE: If Trial User finishes Tronc Commun => Redirect to Pricing
    if (!profile.pack_type && course.category === 'tronc_commun') {
        const { isComplete } = await checkUserTcCompletion(user.id);
        if (isComplete) {
            redirect('/pricing?reason=tc_finished&congrats=true');
        }
    }

    // 6. THE PARANOID CHECK (Time-Lock - Legacy/Specific logic)

    // 5. THE PARANOID CHECK (Time-Lock & Rights)

    // A. Time Lock (With Fast Track Override)
    let monthsSinceSub = 0;
    if (profile.subscription_start) {
        monthsSinceSub = differenceInMonths(new Date(), parseISO(profile.subscription_start));
    }

    if (monthsSinceSub < course.unlock_at_month) {
        // FAST TRACK CHECK 🚀
        // If course is Specialty AND user has a Paid Pack, check if Tronc Commun is done.
        let isFastTrackEligible = false;

        if (course.category === 'specialite' && profile.pack_type) {
            const { data: tcCourses } = await supabase
                .from('courses')
                .select('id')
                .eq('category', 'tronc_commun');

            if (tcCourses && tcCourses.length > 0) {
                const tcIds = tcCourses.map(c => c.id);

                // Correct logic: Direct RPC call
                const { data: progressData } = await supabase
                    .rpc('get_user_course_progress', { course_ids: tcIds });

                if (progressData) {
                    // Check if ALL tc courses are 100%
                    const allTcDone = tcIds.every(id => {
                        const p = progressData.find((d: any) => d.course_id === id);
                        return p && p.progress_percent === 100;
                    });

                    if (allTcDone) {
                        isFastTrackEligible = true;
                    }
                }
            }
        }

        if (!isFastTrackEligible) {
            redirect('/dashboard/eleve?error=locked');
        }
    }



    // B. Specialty Lock
    if (course.category === 'specialite') {
        if (profile.pack_type !== 'master' && course.related_specialty !== profile.specialty) {
            redirect('/dashboard/eleve?error=wrong_specialty');
        }
    }

    // C. Pack Lock (Incubation/Lab)
    if (course.category === 'incubation' && profile.pack_type === 'essentiel') {
        redirect('/dashboard/eleve?error=upgrade_required');
    }


    // 6. Fetch Curriculum (Real Data)
    const { data: chaptersRaw } = await supabase
        .from('chapters')
        .select(`
            id, title, position,
            lessons (
                id, title, type, status, video_url, content_text, duration, position, is_free_preview
            )
        `)
        .eq('course_id', course.id)
        .order('position', { ascending: true });

    // Client-side sort for lessons (just to be safe against Supabase join sorting quirks)
    // and strict typing
    const chapters = (chaptersRaw || []).map(chapter => ({
        ...chapter,
        lessons: (chapter.lessons || []).sort((a, b) => a.position - b.position)
    }));

    // 7. Fetch User Progress (CRITICAL FIX)
    const allLessonIds = chapters.flatMap(c => c.lessons.map(l => l.id));

    let progressMap: Record<string, { is_completed: boolean; last_played_second: number }> = {};

    if (allLessonIds.length > 0) {
        const { data: progressData } = await supabase
            .from('user_progress')
            .select('lesson_id, is_completed, last_played_second')
            .eq('user_id', user.id)
            .in('lesson_id', allLessonIds);

        if (progressData) {
            progressMap = progressData.reduce((acc, curr) => {
                acc[curr.lesson_id] = {
                    is_completed: curr.is_completed || false,
                    last_played_second: curr.last_played_second || 0
                };
                return acc;
            }, {} as Record<string, { is_completed: boolean; last_played_second: number }>);
        }
    }

    // 8. APPLY SEQUENTIAL LOCKING 🔒
    // We flatten, calculate lock status, then map back or mutate.
    // Since chapters are objects, we can mutate them before passing to Client Component.

    // Flatten for sequential check
    const allLessonsFlat = chapters.flatMap(c => c.lessons); // Already sorted in step 6

    let previousLessonCompleted = true; // First lesson is always open

    for (let i = 0; i < allLessonsFlat.length; i++) {
        const lesson = allLessonsFlat[i];

        // Locked status logic:
        // If previous lesson was NOT completed, then THIS lesson is locked.
        // Exception: Lesson 0 is never locked.
        const isLocked = !previousLessonCompleted;

        // Mutate the lesson object to include is_locked
        // We know 'lessons' in 'chapters' are references to the same objects if we flatMapped correctly? 
        // Array.flatMap creates shallow copies? No, it usually creates new array but elements are references if objects?
        // Let's verify. Yes, flatMap on objects returns references.
        // But to be safe, let's update the original structure.

        // Actually, we can just update the `progressMap`? No, lock is a property of the lesson in the viewer.
        // Let's use a Set or Map for locked IDs and re-map the chapters.

        // Wait, I'll just attach it to the lesson object.
        // But wait, `allLessonsFlat` might be copies.
        // Let's iterate the CHAPTERS to be safe and use a global tracker.
    }

    // Re-approach: Iterate chapters -> lessons sequentially
    previousLessonCompleted = true; // Reset

    // We need to mutate the chapters structure to pass to Client
    const chaptersWithLock = chapters.map(chapter => ({
        ...chapter,
        lessons: chapter.lessons.map(lesson => {
            const isLocked = !previousLessonCompleted;

            // Current lesson status for NEXT iteration
            const isCompleted = progressMap[lesson.id]?.is_completed || false;
            previousLessonCompleted = isCompleted;

            return {
                ...lesson,
                is_locked: isLocked
            };
        })
    }));

    // 9. Render The Player
    return <CourseViewer course={course} chapters={chaptersWithLock} progressMap={progressMap} />;
}

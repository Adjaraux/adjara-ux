'use server';
import { createClient } from '@supabase/supabase-js'; // Fixed import

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { } // Server Actions can be called from Client Components without write access
                },
            },
        }
    );
}

/**
 * Toggles a lesson's completion status.
 */
export async function toggleLessonComplete(lessonId: string, isCompleted: boolean, courseSlug: string) {
    const supabase = await getSupabase();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 2. Upsert Progress
    // We use upsert to create the row if it doesn't exist (e.g. first time viewing)
    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            is_completed: isCompleted,
            last_updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, lesson_id' // Uses the composite PK
        });

    if (error) {
        console.error("Error toggling lesson:", error);
        throw new Error("Failed to update progress");
    }

    // Refresh everything
    revalidatePath(`/dashboard/eleve/cours/${courseSlug}`);
    revalidatePath('/dashboard/eleve', 'layout');
}

/**
 * Updates the "last watched second" for video resume.
 * This is a "silent" action (no revalidation needed immediately).
 */
export async function updateVideoProgress(lessonId: string, seconds: number) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return; // Fail silently for auth issues on heartbeat

    // Upsert but keep existing is_completed status if row exists
    // Trick: we can't easily "keep existing" in a simple INSERT ON CONFLICT DO UPDATE
    // unless we read it first OR we ignore is_completed.
    // However, Supabase upsert overwrites all fields provided.
    // We should be careful not to reset 'is_completed' to null/false if it's true.

    // Better strategy: Use a specific update via match, or simple upsert but only specific columns?
    // Supabase JS upsert updates ALL columns in the object.

    // Solution: We'll use a small trick. We first try to UPDATE. If it affects 0 rows, we INSERT.
    // OR we can just accept that we need to read first? No, too slow for heartbeat.
    // BEST: Just update the specific column if row exists?

    // Let's use PostgreSQL native capability via RPC or just assume row exists?
    // Actually, 'user_progress' might not exist if user skipped "Mark Complete".
    // Let's do a simple upsert but we need to know 'is_completed'.

    // Compromise: We only update 'last_played_second'.
    // If we use .update(), it only works if row exists.
    // If row doesn't exist, we need to create it with is_completed=false.

    // Attempt UPDATE first


    // If no row updated (data is empty or null), INSERT new one
    // Note: .update().select() returns the updated rows in 'data'.
    const { data } = await supabase // re-awaiting or just using the result object
        .from('user_progress')
        .update({
            last_played_second: Math.floor(seconds),
            last_updated_at: new Date().toISOString()
        })
        .match({ user_id: user.id, lesson_id: lessonId })
        .select('lesson_id');

    if (!data || data.length === 0) {
        await supabase.from('user_progress').insert({
            user_id: user.id,
            lesson_id: lessonId,
            last_played_second: Math.floor(seconds),
            is_completed: false
        });
    }
}

/**
 * Validates quiz submission securely server-side.
 */
export async function submitQuiz(lessonId: string, userAnswers: Record<string, string | string[]>, courseSlug: string) {

    // 1. Setup Admin Client via supabase-js (Bypass RLS reliably)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from env!");
        throw new Error("Server configuration error");
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );

    const supabaseUser = await getSupabase(); // Regular user client for Auth check
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 2. Fetch Questions & Correct Answers (using Admin Privilege)
    const { data: questions, error: qError } = await supabaseAdmin
        .from('questions')
        .select(`
            id, 
            points, 
            type,
            answers (id, is_correct)
        `)
        .eq('lesson_id', lessonId);

    if (qError) {
        console.error("❌ DB Error fetching quiz:", qError);
        throw new Error("Database error");
    }

    if (!questions || questions.length === 0) {
        throw new Error("Quiz not found");
    }

    // 3. Calculate Score
    let totalPoints = 0;
    let earnedPoints = 0;
    const corrections: Record<string, boolean> = {}; // questionId -> isCorrect

    for (const q of questions) {
        totalPoints += (q.points || 1);

        const submitted = userAnswers[q.id];

        // Ensure answers is an array before filtering
        const answersList = Array.isArray(q.answers) ? q.answers : [];
        const correctAnswers = answersList.filter((a: any) => a.is_correct).map((a: any) => a.id);

        let isCorrect = false;

        if (q.type === 'single') {
            // Submitted should be a single ID string
            if (typeof submitted === 'string' && correctAnswers.includes(submitted)) {
                isCorrect = true;
            }
        } else {
            // Multiple choice (future proof)
            // For now assume single choice in UI but logic handles arrays
            // Simple logic: Arrays must match exactly (ignoring order)
            if (Array.isArray(submitted)) {
                if (submitted.length === correctAnswers.length && submitted.every(val => correctAnswers.includes(val))) {
                    isCorrect = true;
                }
            }
        }

        if (isCorrect) {
            earnedPoints += (q.points || 1);
        }

        corrections[q.id] = isCorrect;
    }

    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = scorePercentage >= 80; // 80% passing grade

    // 4. Update Progress ONLY if Passed (for now - ensuring validation)
    if (passed) {
        await supabaseUser
            .from('user_progress')
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                is_completed: true,
                score: earnedPoints,
                max_score: totalPoints,
                last_updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, lesson_id'
            });

        revalidatePath(`/dashboard/eleve/cours/${courseSlug}`);
        revalidatePath('/dashboard/eleve');
    }

    return {
        passed,
        scorePercentage,
        corrections, // Tell user which questions they got right/wrong
        totalPoints,
        earnedPoints
    };
}

'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type QuizAttempt = {
    id: string;
    started_at: string;
    questions_snapshot: string[]; // List of question IDs
    duration: number; // Snapshot of lesson duration at start
};

export async function startQuiz(lessonId: string): Promise<{ success: boolean; attempt?: QuizAttempt; questions?: any[]; error?: string }> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non connecté" };

    // 1. Check for existing active attempt
    const { data: existing } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .is('completed_at', null)
        .single();

    let attempt = existing;
    let questionsSnapshot = existing?.questions_snapshot ? JSON.parse(JSON.stringify(existing.questions_snapshot)) : [];

    // 2. Fetch Lesson Settings
    const { data: lesson } = await supabase
        .from('lessons')
        .select('duration, pool_size')
        .eq('id', lessonId)
        .single();

    const duration = lesson?.duration || 20; // Default 20 min
    const poolSize = lesson?.pool_size || 10;

    if (!attempt) {
        // 3. Create New Attempt
        // A. Fetch All Questions via RPC (returns questions with answers)
        const { data: allQuestions, error: qError } = await supabase
            .rpc('get_lesson_quiz', { p_lesson_id: lessonId });

        if (qError || !allQuestions || allQuestions.length === 0) {
            console.error("RPC Error or Empty:", qError);
            return { success: false, error: "Aucune question disponible." };
        }

        // B. Random Pool Draw
        // User RPC response usually structures questions. We need to be careful with structure.
        // Assuming array of { id, text, answers: [] }
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, poolSize);
        questionsSnapshot = selected.map((q: any) => q.id);

        // C. Insert Attempt
        const { data: newAttempt, error } = await supabase
            .from('quiz_attempts')
            .insert({
                user_id: user.id,
                lesson_id: lessonId,
                questions_snapshot: questionsSnapshot,
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };
        attempt = newAttempt;
    }

    // 4. Return Attempt + Question Objects
    // We need to fetch the question details for the snapshot
    // Since we likely just fetched them via RPC or can re-fetch, let's reuse RPC call if needed, 
    // OR we can trust that we can fetch them again.
    // Optimization: If we just created, we have `selected`. If existing, we assume RPC returns all and we filter.

    const { data: allQuestionsSafe } = await supabase
        .rpc('get_lesson_quiz', { p_lesson_id: lessonId });

    // Sort by snapshot order
    const orderedQuestions = questionsSnapshot.map((id: string) => {
        const q = allQuestionsSafe?.find((aq: any) => aq.id === id);
        if (!q) return null;
        // Safety: Strip is_correct if present (RPC should strip it, but double check)
        const safeAnswers = q.answers?.map((a: any) => ({
            id: a.id,
            text: a.text
            // omit is_correct
        }));
        return { ...q, answers: safeAnswers };
    }).filter(Boolean);

    return {
        success: true,
        attempt: {
            id: attempt.id,
            started_at: attempt.started_at,
            questions_snapshot: questionsSnapshot,
            duration: duration
        },
        questions: orderedQuestions
    };
}

import { revalidatePath } from 'next/cache';

export async function submitQuizAttempt(attemptId: string, userAnswers: Record<string, string | string[]>): Promise<{ success: boolean; passed?: boolean; score?: number; error?: string }> {
    // 1. Setup Admin Client (Bypass RLS for robust grading)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Configuration error");

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
    );

    // 2. Get Attempt
    const { data: attempt } = await supabaseAdmin
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

    if (!attempt) return { success: false, error: "Tentative introuvable." };
    if (attempt.completed_at) return { success: false, error: "Déjà soumis." };

    // 3. Time Check
    const startTime = new Date(attempt.started_at).getTime();

    // Fetch duration and slug from lesson (joined with courses)
    const { data: lesson } = await supabaseAdmin
        .from('lessons')
        .select('duration, course_id, courses(slug)')
        .eq('id', attempt.lesson_id)
        .single();

    const durationMinutes = lesson?.duration || 20;
    const now = Date.now();
    // Allow 2 min grace
    if ((now - startTime) > (durationMinutes * 60 * 1000 + 120000)) {
        // Technically timeout
    }

    // 4. Grade it
    const questionIds = attempt.questions_snapshot as string[];

    // Fetch Correct Answers
    const { data: questions } = await supabaseAdmin
        .from('questions')
        .select(`
            id, 
            points,
            type,
            answers (id, is_correct)
        `)
        .in('id', questionIds);

    let score = 0;
    let totalPoints = 0;

    questionIds.forEach(qId => {
        const q = questions?.find((k: any) => k.id === qId);
        if (q) {
            totalPoints += (q.points || 1);
            const userParams = userAnswers[qId]; // string | string[]

            // Identify ALL correct answers
            const correctAnswers = q.answers?.filter((a: any) => a.is_correct).map((a: any) => a.id) || [];

            // Normalize user input to array
            const userAnsArray = Array.isArray(userParams) ? userParams : (userParams ? [userParams] : []);

            // Check strict equality (Sets)
            // 1. Same length
            // 2. All user items in correct items
            const isCorrect = correctAnswers.length === userAnsArray.length &&
                userAnsArray.every((id: string) => correctAnswers.includes(id));

            if (isCorrect) {
                score += (q.points || 1);
            }
        }
    });

    const passed = totalPoints > 0 && (score / totalPoints) >= 0.7; // 70%

    // 5. Update Attempt
    await supabaseAdmin
        .from('quiz_attempts')
        .update({
            completed_at: new Date().toISOString(),
            answers: userAnswers,
            score: score,
            passed: passed
        })
        .eq('id', attemptId);

    // 6. Update Lesson Progress if Passed
    if (passed) {
        await supabaseAdmin
            .from('user_progress')
            .upsert({
                user_id: attempt.user_id,
                lesson_id: attempt.lesson_id,
                is_completed: true,
                score: score,
                max_score: totalPoints,
                last_updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, lesson_id' });

        // CRITICAL REVALIDATION
        const courseSlug = (lesson as any)?.courses?.slug;
        if (courseSlug) {
            revalidatePath(`/dashboard/eleve/cours/${courseSlug}`);
        }
        revalidatePath('/dashboard/eleve', 'layout');
    }

    return { success: true, passed, score };
}

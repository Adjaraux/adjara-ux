'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/utils/supabase-admin';

export async function getAdminAttempts(limit = 50) {
    const supabase = getAdminClient();

    // 1. Fetch raw attempts
    const { data: rawAttempts, error: rawError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

    if (rawError) {
        return { success: false, error: rawError.message };
    }

    if (!rawAttempts || rawAttempts.length === 0) {
        return { success: true, attempts: [] };
    }

    // 2. Fetch unique User IDs and Lesson IDs
    const userIds = Array.from(new Set(rawAttempts.map(a => a.user_id)));
    const lessonIds = Array.from(new Set(rawAttempts.map(a => a.lesson_id).filter(Boolean)));

    // 3. Parallel fetch Profiles and Lessons
    const [{ data: profiles }, { data: lessons }] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name').in('id', userIds),
        supabase.from('lessons').select('id, title').in('id', lessonIds)
    ]);

    // 4. Manual Merge
    const mapped = rawAttempts.map(a => {
        const p = profiles?.find(prof => prof.id === a.user_id);
        const l = lessons?.find(less => less.id === a.lesson_id);

        return {
            id: a.id,
            user_email: p?.email || 'Inconnu',
            user_name: p?.full_name || 'Sans Nom',
            lesson_title: l?.title || 'Leçon Supprimée',
            started_at: a.started_at,
            completed_at: a.completed_at,
            score: a.score,
            passed: a.passed,
            is_active: !a.completed_at,
            questions_count: a.questions_snapshot?.length || 0
        };
    });

    return { success: true, attempts: mapped };
}

export async function getAdminAttemptDetails(attemptId: string) {
    const supabase = getAdminClient();

    // Get Attempt
    const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

    if (!attempt) return { success: false, error: "Introuvable" };

    // Fetch Questions Snapshot details
    // Need names of questions and answers
    const qIds = attempt.questions_snapshot || [];
    const { data: questions } = await supabase
        .from('questions')
        .select('id, text, answers')
        .in('id', qIds);

    // Map details
    const details = qIds.map((qId: string) => {
        const q = questions?.find((k: any) => k.id === qId);
        const userAnsId = attempt.answers ? attempt.answers[qId] : null;

        let userAnsText = "-";
        let correctAnsText = "-";

        if (q && q.answers) {
            const userA = Array.isArray(q.answers)
                ? q.answers.find((a: any) => a.id === userAnsId)
                : null;
            userAnsText = userA ? userA.text : (userAnsId ? "(ID inconnu)" : "Non répondu");

            const correctA = Array.isArray(q.answers)
                ? q.answers.find((a: any) => a.is_correct)
                : null;
            correctAnsText = correctA ? correctA.text : "Non défini";
        }

        return {
            id: qId,
            question: q?.text || "Question supprimée",
            user_answer: userAnsText,
            correct_answer: correctAnsText,
            is_correct: userAnsText === correctAnsText && userAnsText !== "-", // Simple string check for display
            user_ans_id: userAnsId,
            q_obj: q
        };
    });

    return { success: true, attempt, details };
}

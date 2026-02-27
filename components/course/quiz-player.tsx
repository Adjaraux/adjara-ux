'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Clock, Trophy } from 'lucide-react';
import { startQuiz, submitQuizAttempt, QuizAttempt } from '@/app/actions/quiz';


interface Answer {
    id: string;
    text: string;
}

interface Question {
    id: string;
    text: string;
    answers: Answer[];
    type?: 'single_choice' | 'multiple_choice'; // Added type
}

interface QuizPlayerProps {
    lessonId: string;
    courseSlug: string;
    lessonTitle?: string;
    lessonWeight?: number;
    isCompleted: boolean;
    onSuccess?: () => void;
}

export function QuizPlayer({ lessonId, courseSlug, lessonTitle, lessonWeight = 1, isCompleted: initialCompleted, onSuccess }: QuizPlayerProps) {
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // User Answers: Record<QuestionId, AnswerId | AnswerId[]>
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

    // ... (keep state lines 39-115) --> Wait, I need to keep the code in between or use multiple chunks. 
    // Tool says "EndLine: 264". I should probably do multiple chunks to be precise and avoid deleting the middle.

    // Let's use multi_replace_file_content instead as I need to touch logic in handleSelect and Render loop.
    // Switching to multi_replace.

    const [submitting, startTransition] = useTransition();
    const [result, setResult] = useState<{
        passed: boolean;
        score?: number;
    } | null>(initialCompleted ? { passed: true, score: 0 } : null);

    // Initial Load: Start Quiz & Get Questions
    const initQuiz = useCallback(async () => {
        setLoading(true);
        try {
            const res = await startQuiz(lessonId);
            if (res.success && res.attempt && res.questions) {
                setAttempt(res.attempt);

                // Shuffle Answers for each question (Anti-Recitation)
                const shuffledQuestions = res.questions.map((q: any) => ({
                    ...q,
                    answers: [...q.answers].sort(() => 0.5 - Math.random()) // Simple shuffle
                }));
                setQuestions(shuffledQuestions);

                // Initialize Timer
                if (!initialCompleted) {
                    const startTime = new Date(res.attempt.started_at).getTime();
                    const durationMs = res.attempt.duration * 60 * 1000;
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
                    setTimeLeft(remaining);
                }
            } else {
                console.error(res.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [lessonId, initialCompleted]);

    useEffect(() => {
        if (!initialCompleted) {
            initQuiz();
        } else {
            // Review Mode: Just load questions? 
            // Ideally we'd like to show the user the questions to practice.
            // We can use the same initQuiz but ignore result or specific attempt logic?
            // Let's use initQuiz but we handled initialCompleted in state above differently.
            // Actually, let's allow them to "Start Practice" or just show loaded.
            // For now, let's reuse initQuiz logic for simplicity, but Timer is disabled.
            initQuiz();
        }
    }, [initQuiz, initialCompleted]);

    // Timer Logic
    useEffect(() => {
        if (initialCompleted || timeLeft === null || !attempt) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, initialCompleted, attempt]);

    // Auto-Submit on Timeout
    useEffect(() => {
        if (timeLeft === 0 && !result && !submitting && !initialCompleted) {
            handleSubmit();
        }
    }, [timeLeft, result, submitting, initialCompleted]);

    const handleSelect = (qId: string, aId: string) => {
        if (result && !initialCompleted) return; // Freeze if result shown (unless review mode?)

        setAnswers(prev => {
            const current = prev[qId];
            const q = questions.find(q => q.id === qId);
            const isMulti = q?.type === 'multiple_choice';

            if (isMulti) {
                const currentArray = Array.isArray(current) ? current : (current ? [current as string] : []);
                if (currentArray.includes(aId)) {
                    // Deselect
                    const newArray = currentArray.filter(id => id !== aId);
                    return { ...prev, [qId]: newArray };
                } else {
                    // Select
                    return { ...prev, [qId]: [...currentArray, aId] };
                }
            } else {
                // Single Choice
                return { ...prev, [qId]: aId };
            }
        });
    };

    const handleSubmit = () => {
        if (!attempt) return;

        startTransition(async () => {
            try {
                const res = await submitQuizAttempt(attempt.id, answers);
                if (res.success) {
                    setResult({
                        passed: !!res.passed,
                        score: res.score
                    });

                    // Stop timer
                    setTimeLeft(null);
                    if (res.passed) {
                        onSuccess?.();
                    }
                } else {
                    alert("Erreur: " + res.error);
                }
            } catch (err) {
                console.error(err);
                alert("Erreur technique.");
            }
        });
    };

    const handleRetry = () => {
        setResult(null);
        setAnswers({});
        setAttempt(null);
        setTimeLeft(null);
        initQuiz(); // Get NEW Attempt & NEW Questions
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Formatting Timer
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    if (questions.length === 0) return <div className="p-8 text-center text-slate-500">Pas de questions disponibles.</div>;

    const isReview = initialCompleted;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 relative">

            {/* Timer Header (Sticky) */}
            {!isReview && timeLeft !== null && (
                <div className={`sticky top-4 z-20 mb-6 p-4 rounded-xl shadow-lg border-2 flex items-center justify-between backdrop-blur-md transition-colors ${timeLeft < 60 ? 'bg-red-50/90 border-red-200 text-red-700' : 'bg-white/90 border-slate-200 text-slate-700'}`}>
                    <div className="flex items-center font-mono text-2xl font-bold">
                        <Clock className={`w-6 h-6 mr-3 ${timeLeft < 60 && 'animate-pulse'}`} />
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                        Temps Restant
                    </div>
                </div>
            )}

            <div className="mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    {lessonTitle || 'Examen'}
                    {isReview && <span className="text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Mode Révision</span>}
                </h1>
                <p className="text-slate-500">
                    {isReview ? "Entraînez-vous sans contrainte de temps." : "Répondez aux questions avant la fin du chronomètre."}
                </p>
            </div>

            {/* Result Card */}
            {result && !loading && (
                <div className={`mb-8 p-6 rounded-xl border-2 flex flex-col items-center text-center animate-in zoom-in-95 ${result.passed ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
                    {result.passed ? (
                        <>
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-900">Module Validé !</h2>
                            <p className="text-emerald-700 mt-2">Score : {result.score} / {questions.length}</p>
                            {isReview && (
                                <Button onClick={handleRetry} variant="outline" className="mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                                    <RefreshCw className="w-4 h-4 mr-2" /> S'entraîner encore
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <XCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-red-900">Échec de l'examen</h2>
                            <p className="text-red-700 mt-2">Score : {result.score} / {questions.length}. Il faut 70%.</p>
                            <Button onClick={handleRetry} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                                <RefreshCw className="w-4 h-4 mr-2" /> Retenter une nouvelle série
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-8">
                {questions.map((q, index) => {
                    return (
                        <Card key={q.id} className="p-6 border-l-4 border-l-indigo-500 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-800 mb-4 flex gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                </span>
                                {q.text}
                            </h3>

                            <div className="pl-11 space-y-3">
                                {q.answers.map(a => {
                                    const currentAns = answers[q.id];
                                    const isMulti = q.type === 'multiple_choice';
                                    const isSelected = Array.isArray(currentAns)
                                        ? currentAns.includes(a.id)
                                        : currentAns === a.id;

                                    return (
                                        <div
                                            key={a.id}
                                            onClick={() => (!result || isReview) && handleSelect(q.id, a.id)}
                                            className={`
                                                relative flex items-center p-3 rounded-lg border cursor-pointer transition-all
                                                ${isSelected
                                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                                }
                                                ${result && !isReview && 'cursor-default opacity-80'} 
                                            `}
                                        >
                                            <div className={`w-4 h-4 mr-3 flex items-center justify-center border ${isMulti ? 'rounded-sm' : 'rounded-full'} ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                {isSelected && (
                                                    isMulti ? (
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    )
                                                )}
                                            </div>
                                            <span className={`text-sm ${isSelected ? 'font-medium text-indigo-900' : 'text-slate-700'}`}>
                                                {a.text}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Actions */}
            {(!result || (isReview && result.passed)) && (
                // Hide submit if result shown (unless review mode, maybe allow re-submit logic? actually Retry handles it)
                // Simply: If NO result, show Submit.
                !result && (
                    <div className="mt-8 flex justify-end">
                        <Button
                            size="lg"
                            onClick={handleSubmit}
                            disabled={submitting || Object.keys(answers).length < questions.length}
                            className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 font-bold shadow-lg shadow-indigo-200"
                        >
                            {submitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                            {timeLeft !== null ? 'Valider (Final)' : 'Vérifier'}
                        </Button>
                    </div>
                )
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { signVideoUrlV2 } from '@/app/actions/video-signer';
import { updateVideoProgress, submitQuiz } from '@/app/actions/progress';
import { Loader2, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';

interface SecureVideoPlayerProps {
    videoPath: string | null;
    lessonId?: string;
    initialTime?: number;
    posterPath?: string | null;
    autoplay?: boolean;
    courseSlug: string;
    isCompleted?: boolean;
    onProgress?: (maxTime: number) => void;
    onQuizStatus?: (allPassed: boolean) => void;
}

export function SecureVideoPlayer({ videoPath, lessonId, initialTime = 0, posterPath, autoplay = false, courseSlug, isCompleted = false, onProgress, onQuizStatus }: SecureVideoPlayerProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Seek Guard State
    const [maxWatchedTime, setMaxWatchedTime] = useState(initialTime);

    // Quiz State
    const [questions, setQuestions] = useState<any[]>([]);
    const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
    const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Initial Check for Quiz Status
    useEffect(() => {
        if (questions.length > 0) {
            const allPassed = questions.every(q => answeredIds.has(q.id));
            onQuizStatus?.(allPassed);
        } else if (questions.length === 0 && !loading) {
            onQuizStatus?.(true);
        }
    }, [questions, answeredIds, onQuizStatus, loading]);


    // 1. Fetch Signed URL & Quiz Data
    useEffect(() => {
        let isMounted = true;

        const initPlayer = async () => {
            if (!videoPath) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(false);

                // Fetch Video URL and Quiz Data
                const [urlResult, quizResult] = await Promise.all([
                    signVideoUrlV2(videoPath),
                    lessonId ? supabase.rpc('get_lesson_quiz', { p_lesson_id: lessonId }) : { data: [] }
                ]);

                if (isMounted) {
                    if (urlResult && urlResult.success && urlResult.signedUrl) {
                        setSignedUrl(urlResult.signedUrl);
                    } else {
                        setError(true);
                    }

                    const quizData = quizResult.data;
                    if (quizData) {
                        const timedQuestions = quizData.filter((q: any) => q.trigger_at !== null && q.trigger_at >= 0);
                        setQuestions(timedQuestions);
                    }
                }
            } catch (err) {
                console.error("Player Init Error:", err);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (videoPath) initPlayer();

        return () => { isMounted = false; };
    }, [videoPath, lessonId, supabase]);

    // 2. Set Initial Time (Resume) & Max Watched
    useEffect(() => {
        if (signedUrl && videoRef.current && initialTime > 0) {
            if (videoRef.current.currentTime < 1) {
                videoRef.current.currentTime = initialTime;
                setMaxWatchedTime(initialTime);
                onProgress?.(initialTime);
            }
        }
    }, [signedUrl, initialTime]);

    // 3. Heartbeat (Progress)
    useEffect(() => {
        if (!lessonId) return;

        const interval = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused) {
                const ct = videoRef.current.currentTime;
                if (ct > 5) {
                    updateVideoProgress(lessonId, ct).catch(e => console.error(e));
                }
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [lessonId]);

    // 4. Time Update Listener (The Core Trigger Logic & Seek Guard)
    const handleTimeUpdate = () => {
        if (!videoRef.current || activeQuestion) return;

        const currentTime = videoRef.current.currentTime;

        // A. SEEK GUARD 🛡️
        // REVIEW MODE: If completed, DISABLE GUARD
        if (!isCompleted) {
            // Find first unanswered quiz time
            const firstUnansweredQuiz = questions
                .filter(q => !answeredIds.has(q.id))
                .sort((a, b) => a.trigger_at - b.trigger_at)[0];

            const quizBarrier = firstUnansweredQuiz ? firstUnansweredQuiz.trigger_at : Infinity;

            // Strict Max is the lesser of MaxWatched or the Next Quiz
            // We allow a tiny buffer (0.5s) BEFORE the quiz to ensure it triggers
            const effectiveMax = Math.min(maxWatchedTime, quizBarrier - 0.5);

            // Allow a small buffer (2s) for stuttering/lag
            if (currentTime > effectiveMax + 2.0) {
                // VIOLATION DETECTED
                videoRef.current.currentTime = effectiveMax;
                console.warn("Seek prevented: Blocked by MaxWatched or Quiz Barrier");
                return;
            }

            // Update Max Watched if we progressed normally
            // But do NOT exceed the quiz barrier until it is passed (which happens via Trigger)
            if (currentTime > maxWatchedTime && currentTime < quizBarrier) {
                setMaxWatchedTime(currentTime);
                onProgress?.(currentTime);
            }
        }

        // B. QUIZ TRIGGER
        // REVIEW MODE: If completed, DISABLE TRIGGERS
        if (isCompleted || questions.length === 0) return;

        // Find a question that:
        // 1. Is close to current time
        // 2. Has NOT been answered yet
        const trigger = questions.find(q =>
            Math.abs(q.trigger_at - currentTime) < 1.0 && // Tighter window
            !answeredIds.has(q.id)
        );

        if (trigger) {
            videoRef.current.pause();
            setActiveQuestion(trigger);
        }
    };

    // 5. Quiz Handlers
    const handleSubmitAnswer = async () => {
        if (!activeQuestion || !selectedAnswer || !lessonId) return;
        setIsSubmitting(true);

        try {
            // Note: submitQuiz expects (lessonId, answers, courseSlug)
            const result = await submitQuiz(lessonId, {
                [activeQuestion.id]: selectedAnswer
            }, courseSlug);

            // result.corrections is map of qId -> isCorrect
            const isCorrect = result.corrections[activeQuestion.id];

            if (isCorrect) {
                setFeedback('correct');
                // Auto resume after delay
                setTimeout(() => {
                    handleResume();
                }, 1500);
            } else {
                setFeedback('incorrect');
            }

        } catch (err) {
            console.error(err);
            alert("Erreur technique lors de la validation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResume = () => {
        if (activeQuestion) {
            setAnsweredIds(prev => new Set(prev).add(activeQuestion.id));
            setActiveQuestion(null);
            setSelectedAnswer(null);
            setFeedback(null);
            videoRef.current?.play();
        }
    };

    if (!videoPath) return <div className="aspect-video bg-slate-900 flex items-center justify-center text-slate-500 text-sm">Aucune vidéo.</div>;
    if (loading) return <div className="aspect-video bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;
    if (error || !signedUrl) return <div className="aspect-video bg-slate-900 flex flex-col items-center justify-center text-red-500"><AlertCircle className="w-8 h-8" /><span className="text-sm">Erreur.</span></div>;

    return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-slate-800 group">
            <video
                ref={videoRef}
                src={signedUrl}
                className="w-full h-full object-contain"
                controls
                controlsList="nodownload"
                autoPlay={autoplay}
                onContextMenu={(e) => e.preventDefault()}
                onTimeUpdate={handleTimeUpdate}
            >
                Not supported.
            </video>

            {/* QUIZ OVERLAY */}
            {activeQuestion && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-900">Quiz Rapide ⚡</h3>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-mono">
                                {Math.floor(activeQuestion.trigger_at / 60)}:{(activeQuestion.trigger_at % 60).toString().padStart(2, '0')}
                            </span>
                        </div>

                        <p className="text-slate-700 font-medium text-lg">{activeQuestion.text}</p>

                        <div className="space-y-2">
                            {activeQuestion.answers.map((a: any) => (
                                <button
                                    key={a.id}
                                    onClick={() => !feedback && setSelectedAnswer(a.id)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedAnswer === a.id
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                                        : 'border-slate-100 hover:border-indigo-200 text-slate-600'
                                        } ${feedback === 'correct' && selectedAnswer === a.id ? 'border-emerald-500 bg-emerald-50' : ''}
                                      ${feedback === 'incorrect' && selectedAnswer === a.id ? 'border-red-500 bg-red-50' : ''}
                                    `}
                                    disabled={!!feedback}
                                >
                                    {a.text}
                                </button>
                            ))}
                        </div>

                        {feedback === 'incorrect' && (
                            <div className="text-red-600 text-sm font-medium flex items-center animate-in shake">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Mauvaise réponse. Réessayez !
                                <button onClick={() => setFeedback(null)} className="ml-auto underline">Réessayer</button>
                            </div>
                        )}

                        {feedback === 'correct' && (
                            <div className="text-emerald-600 text-sm font-medium flex items-center animate-in zoom-in">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Bravo ! Reprise de la vidéo...
                            </div>
                        )}

                        {!feedback && (
                            <Button
                                onClick={handleSubmitAnswer}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                                disabled={!selectedAnswer || isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Valider & Continuer'}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play, LayoutList, Lock, CheckCircle, FileText, Download, Loader2, Trophy, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SecureVideoPlayer } from './secure-video-player';
import { Badge } from '@/components/ui/badge';
import { toggleLessonComplete } from '@/app/actions/progress';
import { QuizPlayer } from './quiz-player';
import { generateCertificate } from '@/app/actions/certificates';
import { getSignedUrl } from '@/app/actions/storage';
import { useAcademyLogic } from '@/hooks/use-academy-logic';
import { checkUserTcCompletion } from '@/app/actions/academy';

function SecurePDFViewer({ path }: { path?: string }) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!path) return;
        getSignedUrl(path, undefined, 'academy_content').then(res => {
            if (res.success && res.signedUrl) setUrl(res.signedUrl);
        });
    }, [path]);

    if (!path) return <div className="text-red-500">PDF introuvable.</div>;
    if (!url) return <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin w-4 h-4" /> Chargement du document...</div>;

    return (
        <div className="w-full flex flex-col items-center gap-4 animate-in fade-in">
            <iframe
                src={`${url}#toolbar=0`}
                className="w-full h-[600px] rounded-lg border shadow-sm bg-white"
            />
            <Button variant="outline" onClick={() => window.open(url, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger le PDF
            </Button>
        </div>
    );
}

// TYPES
type Lesson = {
    id: string;
    title: string;
    type: 'video' | 'text' | 'pdf' | 'quiz';
    status: 'draft' | 'published' | 'scheduled';
    video_url?: string;
    content_text?: string;
    duration: number;
    position: number;
    weight?: number;
    is_free_preview: boolean;
    is_locked?: boolean;
};

type Chapter = {
    id: string;
    title: string;
    position: number;
    lessons: Lesson[];
};

type Course = {
    id: string;
    title: string;
    category: string;
    slug: string;
};

interface CourseViewerProps {
    course: Course;
    chapters: Chapter[];
    progressMap: Record<string, { is_completed: boolean; last_played_second: number }>;
}

export function CourseViewer({ course, chapters, progressMap = {} }: CourseViewerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile } = useAcademyLogic();

    // Flatten lessons for easy navigation (Next/Prev)
    const allLessons = chapters.flatMap(c => c.lessons);

    // Calculate Global Progress
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter(l => progressMap[l.id]?.is_completed).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // State
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Initialize Active Lesson
    useEffect(() => {
        const lessonParam = searchParams.get('lesson');
        // Find if requested lesson is valid AND unlocked
        if (lessonParam) {
            const requestedLesson = allLessons.find(l => l.id === lessonParam);
            if (requestedLesson) {
                if (requestedLesson.is_locked) {
                    console.warn("Attempted to access locked lesson");
                } else {
                    setActiveLessonId(lessonParam);
                    return;
                }
            }
        }

        // Default to first lesson (which should be unlocked)
        if (allLessons.length > 0 && !activeLessonId) {
            setActiveLessonId(allLessons[0].id);
        }
    }, [chapters, searchParams]);

    const activeLesson = allLessons.find(l => l.id === activeLessonId);
    const activeProgress = activeLesson ? progressMap[activeLesson.id] : undefined;
    const isLessonCompleted = activeProgress?.is_completed || false;

    // Navigation Handlers
    const goToLesson = (lessonId: string) => {
        const targetLesson = allLessons.find(l => l.id === lessonId);
        if (!targetLesson || targetLesson.is_locked) {
            alert("Ce cours est verrouillé. Terminez le précédent pour avancer.");
            return;
        }

        setActiveLessonId(lessonId);
        const url = new URL(window.location.href);
        url.searchParams.set('lesson', lessonId);
        window.history.pushState({}, '', url);
    };

    const handleNext = () => {
        if (!activeLesson) return;
        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex < allLessons.length - 1) {
            const nextLesson = allLessons[currentIndex + 1];
            if (!nextLesson.is_locked) {
                goToLesson(nextLesson.id);
            } else {
                alert("Le cours suivant est verrouillé.");
            }
        }
    };

    const handlePrev = () => {
        if (!activeLesson) return;
        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex > 0) {
            goToLesson(allLessons[currentIndex - 1].id);
        }
    };

    // Local State for Optimistic UI
    const [optimisticCompleted, setOptimisticCompleted] = useState<boolean>(false);
    const [isToggling, setIsToggling] = useState(false);
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);

    // Sync local state
    useEffect(() => {
        if (activeLesson) {
            const serverState = progressMap[activeLesson.id]?.is_completed || false;
            setOptimisticCompleted(serverState);
        }
    }, [activeLesson, progressMap]);

    const checkTCCompletion = async (lessonId: string) => {
        if (course.category !== 'tronc_commun' || profile?.pack_type) return;

        // Optimized check: If we are here, at least the current course items are likely the last ones
        // but we verify globally via server for 100% accuracy
        try {
            const { isComplete } = await checkUserTcCompletion(profile?.id || '');
            if (isComplete) {
                router.push('/pricing?reason=tc_finished&congrats=true');
            }
        } catch (err) {
            console.error("Failed to check global TC completion", err);
        }
    };

    // Video Security State (Restored)
    const [maxTime, setMaxTime] = useState(0);
    const [allQuizzesPassed, setAllQuizzesPassed] = useState(false);

    useEffect(() => {
        setMaxTime(0);
        setAllQuizzesPassed(false);
    }, [activeLessonId]);

    const handleToggleComplete = async () => {
        if (!activeLesson || isToggling) return;

        const newState = !optimisticCompleted;
        setOptimisticCompleted(newState);
        setIsToggling(true);

        try {
            await toggleLessonComplete(activeLesson.id, newState, course.slug);

            if (newState) {
                checkTCCompletion(activeLesson.id);
            }

            router.refresh();
        } catch (err) {
            console.error("Failed to toggle completion", err);
            setOptimisticCompleted(!newState);
        } finally {
            setIsToggling(false);
        }
    };

    if (chapters.length === 0) {
        return <div className="p-8 text-center text-slate-500">Ce cours est vide pour le moment.</div>;
    }

    const watchedPercentage = activeLesson && activeLesson.duration > 0 ? (maxTime / activeLesson.duration) * 100 : 0;
    const canValidate = optimisticCompleted || (activeLesson?.type !== 'video') || (watchedPercentage >= 90 && allQuizzesPassed);

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col md:flex-row gap-6 -m-4 md:-m-8">
            <div className="flex-1 flex flex-col bg-slate-950/5 md:bg-transparent overflow-hidden">
                <div className="md:hidden p-4 bg-white border-b mb-1 flex items-center justify-between shadow-sm sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(true)} className="text-slate-600">
                            <Menu className="w-6 h-6" />
                        </Button>
                        <h1 className="font-bold text-sm truncate max-w-[150px]">{course.title}</h1>
                    </div>
                    <Link href="/dashboard/eleve">
                        <Button variant="ghost" size="sm" className="text-xs">Quitter</Button>
                    </Link>
                </div>

                <div className={`bg-slate-900 md:rounded-xl shadow-lg border border-slate-800 overflow-hidden flex-shrink-0 ${activeLesson?.type === 'video' ? '' : 'flex items-center justify-center min-h-[400px]'}`}>
                    {activeLesson ? (
                        activeLesson.type === 'video' ? (
                            <SecureVideoPlayer
                                videoPath={activeLesson.video_url || null}
                                autoplay={false}
                                lessonId={activeLesson.id}
                                courseSlug={course.slug}
                                initialTime={activeProgress?.last_played_second || 0}
                                isCompleted={isLessonCompleted}
                                onProgress={setMaxTime}
                                onQuizStatus={setAllQuizzesPassed}
                            />
                        ) : activeLesson.type === 'quiz' ? (
                            <div className="bg-white overflow-y-auto max-h-[600px] w-full h-full">
                                <QuizPlayer
                                    lessonId={activeLesson.id}
                                    courseSlug={course.slug}
                                    lessonTitle={activeLesson.title}
                                    lessonWeight={activeLesson.weight}
                                    isCompleted={isLessonCompleted}
                                    onSuccess={() => checkTCCompletion(activeLesson.id)}
                                />
                            </div>
                        ) : activeLesson.type === 'pdf' ? (
                            <div className="bg-slate-100 w-full h-full flex flex-col items-center justify-center p-8">
                                <FileText className="w-16 h-16 text-slate-400 mb-4" />
                                <h2 className="text-xl font-bold text-slate-800 mb-2">{activeLesson.title}</h2>
                                <p className="text-slate-500 mb-6">Ce document PDF est prêt à être consulté.</p>
                                <SecurePDFViewer path={activeLesson.video_url} />
                            </div>
                        ) : (
                            <div className="aspect-video bg-white overflow-y-auto p-8 text-slate-800 w-full h-full">
                                <h2 className="text-2xl font-bold mb-4">{activeLesson.title}</h2>
                                <div className="prose prose-slate max-w-none">
                                    <p className="whitespace-pre-wrap">{activeLesson.content_text || "Aucun contenu texte."}</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="aspect-video flex items-center justify-center text-slate-500">
                            Sélectionnez une leçon
                        </div>
                    )}
                </div>

                <div className="bg-white border md:border-t-0 border-slate-200 md:rounded-b-xl p-6 flex flex-col gap-4 shadow-sm flex-1 overflow-y-auto">
                    {activeLesson && (
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    {activeLesson.title}
                                    {isLessonCompleted && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {activeLesson.type === 'video' ? 'Vidéo' : 'Lecture'} • {Math.floor(activeLesson.duration / 60)} min
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handlePrev} disabled={!activeLesson || allLessons.findIndex(l => l.id === activeLesson.id) === 0}>
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Précédent
                                    </Button>
                                    <Button onClick={handleNext} disabled={!activeLesson || allLessons.findIndex(l => l.id === activeLesson.id) === allLessons.length - 1}>
                                        Suivant
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>

                                <div className="flex flex-col items-end">
                                    <Button
                                        variant="ghost"
                                        onClick={handleToggleComplete}
                                        disabled={isToggling || !canValidate}
                                        className={`w-full font-semibold transition-all ${optimisticCompleted
                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                                            : (canValidate ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed")
                                            }`}
                                    >
                                        {optimisticCompleted ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Validé
                                            </>
                                        ) : (
                                            "Marquer comme terminé"
                                        )}
                                    </Button>
                                    {!canValidate && activeLesson.type === 'video' && (
                                        <span className="text-[10px] text-red-500 mt-1 text-right max-w-[200px] leading-tight">
                                            Visionnez 90% ({Math.round(watchedPercentage)}%) et réussissez les quiz.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CURRICULUM SIDEBAR / DRAWER */}
            <AnimatePresence>
                {(typeof window !== 'undefined' && window.innerWidth < 768 ? showMobileMenu : true) && (
                    <>
                        {/* Overlay for mobile */}
                        {showMobileMenu && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowMobileMenu(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                            />
                        )}

                        <motion.div
                            initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { x: '100%' } : false}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{ transform: 'translate3d(0, 0, 0)' }}
                            className={`
                                fixed md:relative right-0 top-0 bottom-0 z-50
                                w-[85%] md:w-80 bg-white md:rounded-xl shadow-2xl md:shadow-sm border-l md:border border-slate-100 
                                flex flex-col h-full overflow-hidden transition-all
                            `}
                        >
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="md:hidden flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(false)}>
                                            <X className="w-5 h-5 text-slate-500" />
                                        </Button>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Programme</span>
                                    </div>
                                    <div className="hidden md:flex items-center gap-2">
                                        <Link href="/dashboard/eleve/learning">
                                            <Button variant="ghost" size="icon" className="-ml-2 hover:bg-white text-slate-500">
                                                <ChevronLeft className="w-5 h-5" />
                                            </Button>
                                        </Link>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Programme</span>
                                    </div>
                                    <div className="w-8"></div>
                                </div>

                                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2">{course.title}</h3>

                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>{progressPercent}% complété</span>
                                    <span>{completedLessons}/{totalLessons}</span>
                                </div>

                                {progressPercent === 100 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <Link href="/dashboard/eleve/diplomas" className="block">
                                            <Button
                                                variant="outline"
                                                className="w-full border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors py-5"
                                            >
                                                <Trophy className="w-4 h-4 mr-2" />
                                                Mon Diplôme
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-4 pb-20 md:pb-2">
                                {chapters.map((chapter) => (
                                    <div key={chapter.id}>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-2">
                                            {chapter.title}
                                        </h4>
                                        <div className="space-y-1">
                                            {chapter.lessons.map(lesson => {
                                                const isActive = activeLessonId === lesson.id;
                                                const isCompleted = progressMap[lesson.id]?.is_completed;
                                                const isLocked = lesson.is_locked;

                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => {
                                                            if (!isLocked) {
                                                                goToLesson(lesson.id);
                                                                if (window.innerWidth < 768) setShowMobileMenu(false);
                                                            }
                                                        }}
                                                        disabled={isLocked}
                                                        className={`w-full flex items-start p-3 md:p-2 rounded-xl md:rounded-lg text-left transition-all active:scale-[0.98] active:bg-slate-100 ${isActive
                                                            ? 'bg-indigo-50 border border-indigo-100 shadow-sm'
                                                            : (isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50 border border-transparent')
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 w-6 h-6 md:w-5 md:h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] mr-3 transition-colors ${isLocked ? 'bg-slate-200 text-slate-500' : (
                                                            isCompleted ? 'bg-emerald-500 text-white' : (
                                                                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                                            )
                                                        )
                                                            }`}>
                                                            {isLocked ? <Lock className="w-3 h-3" /> : (
                                                                isCompleted ? <CheckCircle className="w-3 h-3" /> : (
                                                                    isActive ? <Play className="w-2.5 h-2.5 ml-0.5" /> : (
                                                                        lesson.type === 'video' ? <Play className="w-2.5 h-2.5 ml-0.5" /> : <FileText className="w-2.5 h-2.5" />
                                                                    )
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-semibold md:font-medium truncate ${isActive ? 'text-indigo-900' : (isCompleted ? 'text-slate-500' : (isLocked ? 'text-slate-400' : 'text-slate-700'))}`}>
                                                                {lesson.title}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    {Math.floor(lesson.duration / 60)} min
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

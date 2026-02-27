'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Target, Trophy, Rocket } from 'lucide-react';
import { CourseCard } from '@/components/dashboard/course-card';
import { Button } from '@/components/ui/button';

interface LearningClientProps {
    courses: any[];
    profile: any;
    monthsSinceSub: number;
    isLateOnTc: boolean;
    needsSpecialtySelection: boolean;
    needsSubscription?: boolean;
}

export function LearningClient({
    courses,
    profile,
    monthsSinceSub,
    isLateOnTc,
    needsSpecialtySelection,
    needsSubscription
}: LearningClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const paymentStatus = searchParams.get('status');

    // SECURITY REDIRECT: If TC complete but NO pack => Pricing
    useEffect(() => {
        if (needsSubscription) {
            router.push('/pricing?reason=tc_finished');
        }
    }, [needsSubscription, router]);

    // Stats
    const unlockedCount = courses.filter(c => !c.isLocked).length;
    const tcCourses = courses.filter(c => c.category === 'tronc_commun');
    const isTcComplete = tcCourses.length > 0 && tcCourses.every(c => (c.progressPercent || 0) === 100);

    return (
        <div className="space-y-8">
            {/* Payment Feedback */}
            {paymentStatus === 'payment_callback' && (
                <Alert className="bg-indigo-50 border-indigo-200 text-indigo-800">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <AlertTitle>Paiement en cours de traitement...</AlertTitle>
                    <AlertDescription>
                        Nous vérifions votre transaction. Votre accès sera débloqué automatiquement dans quelques instants.
                    </AlertDescription>
                </Alert>
            )}

            {/* LATE ALERT BANNER */}
            {isLateOnTc && !isTcComplete && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-sm animate-in slide-in-from-top">
                    <div className="flex items-start gap-4">
                        <Rocket className="w-6 h-6 text-amber-600 mt-1" />
                        <div>
                            <h3 className="font-bold text-amber-900">Le groupe avance ! 🚀</h3>
                            <p className="text-amber-800 mt-1">
                                Vous avez un peu de retard sur le programme officiel. Ne lâchez rien !
                                Terminez vite votre Tronc Commun pour débloquer votre spécialité.
                            </p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    const firstIncomplete = tcCourses.find(c => (c.progressPercent || 0) < 100);
                                    if (firstIncomplete) router.push(`/dashboard/eleve/learning?course=${firstIncomplete.id}`);
                                }}
                                className="p-0 h-auto font-bold text-amber-700 hover:text-amber-900"
                            >
                                Reprendre mon Tronc Commun &rarr;
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* SPECIALTY UNLOCK BANNER */}
            {needsSpecialtySelection && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg animate-in slide-in-from-top duration-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <Trophy className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-2xl">Tronc Commun Validé ! 🎓</h2>
                                <p className="text-amber-100">Il est temps de choisir votre voie d'excellence.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/dashboard/eleve/selection-specialite')}
                            className="bg-white text-orange-600 font-bold px-6 py-3 rounded-lg shadow-sm hover:bg-orange-50 transition-colors"
                        >
                            Choisir ma Spécialité &rarr;
                        </Button>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mon Apprentissage 📚</h1>
                    <p className="text-slate-600 mt-2">
                        Mois {monthsSinceSub} •
                        <span className="ml-2 font-medium text-indigo-600 capitalize">
                            Pack {profile?.pack_type || 'Standard'}
                        </span>
                    </p>
                </div>

                {/* Mini Stats */}
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="bg-emerald-50 p-2 rounded-lg">
                            <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-semibold uppercase">Accessibles</div>
                            <div className="font-bold text-slate-900">{unlockedCount} cours</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Course Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length > 0 ? (
                    courses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))
                ) : (
                    <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Trophy className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Aucun cours disponible</h3>
                        <p className="text-slate-500 mt-2">Votre parcours personnalisé est en cours de préparation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

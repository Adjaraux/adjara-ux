'use client';

import { useEffect, useState } from 'react';
import { useAcademyLogic } from '@/hooks/use-academy-logic';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Assuming we have these or similar
import { Button } from '@/components/ui/button';
import { Trophy, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export function SpecialtyCelebrationModal() {
    const { needsSpecialtySelection, loading } = useAcademyLogic();
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!loading && needsSpecialtySelection) {
            // Don't show on the selection page itself
            if (!pathname.includes('/selection-specialite')) {
                setIsOpen(true);
                // Trigger Confetti
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const random = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti({
                        particleCount,
                        origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 }
                    });
                    confetti({
                        particleCount,
                        origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 }
                    });
                }, 250);
            }
        }
    }, [loading, needsSpecialtySelection, pathname]);

    const handleGoToSelection = () => {
        setIsOpen(false);
        router.push('/dashboard/eleve/selection-specialite');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-br from-amber-400 to-orange-500 p-4 rounded-full shadow-lg border-4 border-white">
                    <Trophy className="w-10 h-10 text-white" />
                </div>

                <DialogHeader className="pt-10 text-center">
                    <DialogTitle className="text-2xl font-bold text-slate-900">Félicitations ! 🎓</DialogTitle>
                    <DialogDescription className="text-lg text-slate-600 mt-2">
                        Vous avez validé <span className="font-bold text-indigo-600">La Base Essentielle</span>.
                        <br />
                        Une nouvelle étape cruciale de votre carrière commence maintenant.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center py-6">
                    <div className="bg-indigo-50 px-6 py-4 rounded-xl flex items-center gap-3 border border-indigo-100">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                        <span className="font-medium text-indigo-900">Accès Spécialités Débloqué</span>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        size="lg"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-6 shadow-xl hover:scale-105 transition-all"
                        onClick={handleGoToSelection}
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Choisir ma Spécialité maintenant
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

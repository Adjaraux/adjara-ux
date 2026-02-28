'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { GraduationCap, Briefcase, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleChoice = async (role: 'eleve' | 'client') => {
        setIsLoading(role);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth');
                return;
            }

            // 1. Force Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: role })
                .eq('id', user.id);

            if (updateError) {
                console.error('[Welcome] Database update failed:', updateError);
                throw updateError;
            }

            // 2. Paranoid Verification: Read it back
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (fetchError || !profile) {
                throw new Error("Impossible de vérifier le rôle après mise à jour.");
            }

            if (profile.role !== role) {
                throw new Error(`Mismatch! Wanted ${role}, got ${profile.role}`);
            }

            // 3. Router Refresh to clear Server Cache
            router.refresh();

            // 4. Strict Redirection
            if (role === 'client') {
                router.push('/dashboard/client');
            } else if (role === 'eleve') {
                router.push('/dashboard/eleve');
            }

        } catch (error) {
            console.error('[Welcome] Critical Error:', error);
            alert("Une erreur est survenue lors de l'enregistrement de votre choix. Consultez la console.");
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-12">

                {/* Header */}
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                        Bienvenue chez <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Adjara UX</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Pour personnaliser votre expérience, dites-nous quel est votre objectif principal aujourd'hui.
                    </p>
                </div>

                {/* Cards Container */}
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">

                    {/* Card: Académie */}
                    <div
                        onClick={() => handleChoice('eleve')}
                        className={`group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 transform hover:-translate-y-1 ${isLoading === 'eleve' ? 'opacity-75 pointer-events-none' : ''}`}
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <div className="p-8 space-y-6">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <GraduationCap className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    Rejoindre l'Académie
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Je souhaite apprendre, suivre des formations certifiantes et développer mes compétences en design et tech.
                                </p>
                            </div>
                            <div className="pt-4 flex items-center text-indigo-600 font-semibold group-hover:translate-x-2 transition-transform">
                                {isLoading === 'eleve' ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <>
                                        Commencer l'apprentissage <ChevronRight className="w-5 h-5 ml-1" />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Card: Prestation */}
                    <div
                        onClick={() => handleChoice('client')}
                        className={`group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 transform hover:-translate-y-1 ${isLoading === 'client' ? 'opacity-75 pointer-events-none' : ''}`}
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                        <div className="p-8 space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Briefcase className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                    Espace Prestation
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Je suis une entreprise ou un particulier et je souhaite commander des services (gravure, design, dev).
                                </p>
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-200">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[12px] leading-tight text-amber-700 font-medium">
                                        <span className="font-bold">Attention :</span> Ce choix est réservé uniquement aux clients. Si vous souhaitez apprendre, sélectionnez la catégorie Académie.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
                                {isLoading === 'client' ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <>
                                        Commander une prestation <ChevronRight className="w-5 h-5 ml-1" />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

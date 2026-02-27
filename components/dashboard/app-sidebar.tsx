'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAcademyLogic } from '@/hooks/use-academy-logic';
import {
    LayoutDashboard,
    BookOpen,
    Lock,
    Zap,
    FlaskConical,
    LogOut,
    GraduationCap,
    Loader2,
    CreditCard,
    Bell,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { getTrialDaysRemaining } from '@/lib/access';

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [showNotif, setShowNotif] = useState(false);
    const { courses, loading, profile, needsSpecialtySelection } = useAcademyLogic();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="w-64 h-screen bg-white border-r border-slate-200 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col md:fixed left-0 top-0">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xl">
                        <GraduationCap className="w-8 h-8" />
                        <span>Académie</span>
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotif(!showNotif)}
                            className="relative p-2 rounded-full hover:bg-slate-100 lg:hidden xl:block"
                        >
                            <Bell className="w-5 h-5 text-slate-500" />
                            {needsSpecialtySelection && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {/* Notification Popover */}
                        {showNotif && (
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95 origin-top-left">
                                {needsSpecialtySelection ? (
                                    <div>
                                        <h4 className="font-bold text-indigo-900 text-sm mb-1">Félicitations ! 🎓</h4>
                                        <p className="text-xs text-slate-500 mb-3">
                                            Vous avez débloqué l'accès aux spécialités.
                                        </p>
                                        <Button
                                            size="sm"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                                            onClick={() => router.push('/dashboard/eleve/selection-specialite')}
                                        >
                                            Chosir ma voie
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 text-center py-2">
                                        Aucune notification
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {profile?.pack_type ? (
                    <div className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Pack {profile.pack_type}
                    </div>
                ) : profile && (
                    <div className="mt-4 p-3 bg-indigo-600 rounded-lg text-white shadow-sm">
                        <div className="text-xs font-medium opacity-80 mb-1">Essai Gratuit</div>
                        <div className="font-bold text-lg mb-2">
                            J-{getTrialDaysRemaining(profile as any)}
                        </div>
                        <Link href="/pricing" className="w-full">
                            <Button size="sm" variant="secondary" className="w-full text-xs h-7 text-indigo-700 font-bold">
                                Choisir un Pack
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">

                <Link href="/dashboard/eleve/learning">
                    <Button
                        variant={pathname.includes('/dashboard/eleve/learning') ? 'secondary' : 'ghost'}
                        className={`w-full justify-start relative group ${pathname.includes('/learning') ? 'bg-orange-50/50 text-brand-orange' : 'text-slate-600 hover:text-brand-orange'}`}
                    >
                        {pathname.includes('/learning') && <div className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full" />}
                        <LayoutDashboard className={`w-5 h-5 mr-3 transition-colors ${pathname.includes('/learning') ? 'text-brand-orange' : 'group-hover:text-brand-orange'}`} />
                        Mon Apprentissage
                    </Button>
                </Link>

                <Link href="/dashboard/eleve/diplomas">
                    <Button
                        variant={pathname.includes('/diplomas') ? 'secondary' : 'ghost'}
                        className={`w-full justify-start relative group ${pathname.includes('/diplomas') ? 'bg-orange-50/50 text-brand-orange' : 'text-slate-600 hover:text-brand-orange'}`}
                    >
                        {pathname.includes('/diplomas') && <div className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full" />}
                        <GraduationCap className={`w-5 h-5 mr-3 transition-colors ${pathname.includes('/diplomas') ? 'text-brand-orange' : 'group-hover:text-brand-orange'}`} />
                        Mes Diplômes
                    </Button>
                </Link>

                <Link href="/dashboard/eleve/missions">
                    <Button
                        variant={pathname.includes('/missions') ? 'secondary' : 'ghost'}
                        className={`w-full justify-start relative group ${pathname.includes('/missions') ? 'bg-orange-50/50 text-brand-orange' : 'text-slate-600 hover:text-brand-orange'}`}
                    >
                        {pathname.includes('/missions') && <div className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full" />}
                        <Briefcase className={`w-5 h-5 mr-3 transition-colors ${pathname.includes('/missions') ? 'text-brand-orange' : 'group-hover:text-brand-orange'}`} />
                        Missions
                        <span className="ml-auto bg-orange-100 text-brand-orange text-[10px] font-bold px-1.5 py-0.5 rounded-full">New</span>
                    </Button>
                </Link>

                <Link href="/dashboard/eleve/profile">
                    <Button
                        variant={pathname.includes('/profile') ? 'secondary' : 'ghost'}
                        className={`w-full justify-start relative group ${pathname.includes('/profile') ? 'bg-orange-50/50 text-brand-orange' : 'text-slate-600 hover:text-brand-orange'}`}
                    >
                        {pathname.includes('/profile') && <div className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full" />}
                        <Zap className={`w-5 h-5 mr-3 transition-colors ${pathname.includes('/profile') ? 'text-brand-orange' : 'group-hover:text-brand-orange'}`} />
                        Mon Profil
                    </Button>
                </Link>

                <Link href="/dashboard/eleve/purchases">
                    <Button
                        variant={pathname.includes('/purchases') ? 'secondary' : 'ghost'}
                        className={`w-full justify-start relative group ${pathname.includes('/purchases') ? 'bg-orange-50/50 text-brand-orange' : 'text-slate-600 hover:text-brand-orange'}`}
                    >
                        {pathname.includes('/purchases') && <div className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full" />}
                        <CreditCard className={`w-5 h-5 mr-3 transition-colors ${pathname.includes('/purchases') ? 'text-brand-orange' : 'group-hover:text-brand-orange'}`} />
                        Historique Achats
                    </Button>
                </Link>

                <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mes Cours
                </div>

                {courses.map((course) => {
                    const isActive = pathname === `/dashboard/eleve/cours/${course.slug}`;
                    return (
                        <div key={course.id} className="relative group">
                            <Link href={course.isLocked ? '#' : `/dashboard/eleve/cours/${course.slug}`}>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start text-sm relative ${course.isLocked
                                        ? 'opacity-50 cursor-not-allowed'
                                        : isActive
                                            ? 'bg-orange-50/50 text-brand-orange'
                                            : 'text-slate-600 hover:text-brand-orange'
                                        }`}
                                    disabled={course.isLocked}
                                >
                                    {isActive && <div className="absolute left-0 w-1 h-5 bg-brand-orange rounded-r-full" />}
                                    <BookOpen className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-brand-orange' : 'group-hover:text-brand-orange'}`} />
                                    <span className="truncate text-left flex-1">{course.title}</span>
                                    {course.isLocked && <Lock className="w-3 h-3 ml-2 text-slate-400" />}
                                </Button>
                            </Link>
                        </div>
                    );
                })}

                {/* Upsell / Locked Areas based on Pack */}
                {(profile?.pack_type === 'expert' || profile?.pack_type === 'master') && (
                    <>
                        <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Accélération
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-amber-600">
                            <Zap className="w-4 h-4 mr-3" />
                            Incubation
                        </Button>
                    </>
                )}

                {profile?.pack_type === 'master' && (
                    <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-purple-600">
                        <FlaskConical className="w-4 h-4 mr-3" />
                        Lab / Leadership
                    </Button>
                )}

            </div>

            {/* Footer Area */}
            <div className="p-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    Se déconnecter
                </Button>
            </div>
        </div>
    );
}

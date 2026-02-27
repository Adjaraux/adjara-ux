'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAgencyLogic } from '@/hooks/use-agency-logic';
import {
    Briefcase,
    FileText,
    MessageSquare,
    LogOut,
    PlusCircle,
    LayoutGrid,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';

export function AgencySidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { projects, loading } = useAgencyLogic();

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
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
            {/* Logo Area (Emerald Theme) */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
                    <Briefcase className="w-8 h-8" />
                    <span>Agence</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Espace Client
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">

                {/* Dashboard Home */}
                <Link href="/dashboard/client">
                    <Button
                        variant={pathname === '/dashboard/client' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start ${pathname === '/dashboard/client' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-emerald-700'}`}
                    >
                        <LayoutGrid className="w-5 h-5 mr-3" />
                        Vue d'ensemble
                    </Button>
                </Link>

                <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mes Projets
                </div>

                {projects.length > 0 ? (
                    projects.map((project) => (
                        <Button
                            key={project.id}
                            variant="ghost"
                            className="w-full justify-start text-sm text-slate-600 hover:text-emerald-700"
                        >
                            <span className={`w-2 h-2 rounded-full mr-3 ${project.status === 'in_progress' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            <span className="truncate text-left flex-1">{project.title}</span>
                        </Button>
                    ))
                ) : (
                    <div className="px-3 py-2 text-sm text-slate-400 italic">Aucun projet actif</div>
                )}

                <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Documents
                </div>

                <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-emerald-700">
                    <FileText className="w-4 h-4 mr-3" />
                    Factures & Devis
                </Button>
                <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-emerald-700">
                    <MessageSquare className="w-4 h-4 mr-3" />
                    Messagerie
                </Button>

                {/* New Project CTA */}
                <div className="mt-6 px-2">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Nouveau Projet
                    </Button>
                </div>

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

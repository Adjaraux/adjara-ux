'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Briefcase, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ClientDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        in_progress: 0,
        pending: 0,
        completed: 0,
        total: 0
    });
    const [recentProjects, setRecentProjects] = useState<any[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchDashboardData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Projects
            const { data: projects, error } = await supabase
                .from('projects')
                .select('*')
                .eq('client_id', user.id)
                .order('created_at', { ascending: false });

            if (projects) {
                const inProgress = projects.filter(p => p.status === 'in_progress' || p.status === 'open' || p.status === 'review' || p.status === 'delivered').length;
                const pending = projects.filter(p => p.status === 'pending_approval').length;
                const completed = projects.filter(p => p.status === 'completed').length;

                setStats({
                    in_progress: inProgress,
                    pending: pending,
                    completed: completed,
                    total: projects.length
                });

                setRecentProjects(projects.slice(0, 3));
            }
            setLoading(false);
        }

        fetchDashboardData();

        // Phase A: Realtime subscription for instant UI updates (snapshots)
        const channel = supabase
            .channel('client-dashboard-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => {
                    fetchDashboardData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bienvenue, Partenaire 👋</h1>
                    <p className="text-slate-600 mt-2">Gérez vos projets et collaborez avec nos meilleurs talents.</p>
                </div>
                <Link href="/dashboard/client/projects/new">
                    <Button className="bg-[#f6941d] hover:bg-orange-600 text-white shadow-sm">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Nouveau Projet
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">En Cours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{stats.in_progress}</div>
                        <p className="text-xs text-slate-500 mt-1">Projets actifs</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">En Attente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{stats.pending}</div>
                        <p className="text-xs text-slate-500 mt-1">Validation requise</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Terminés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{stats.completed}</div>
                        <p className="text-xs text-slate-500 mt-1">Projets livrés</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Empty State */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#f6941d]" /> Activité Récente
                    </h2>

                    {recentProjects.length === 0 ? (
                        <Card className="bg-white border-dashed border-2 border-slate-100">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="bg-orange-50 p-4 rounded-full mb-4">
                                    <Briefcase className="w-8 h-8 text-[#f6941d]" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Aucun projet actif</h3>
                                <p className="text-slate-500 max-w-sm mt-2 mb-6">
                                    Vous n'avez pas encore posté de mission. Lancez votre premier projet pour trouver des talents qualifiés.
                                </p>
                                <Link href="/dashboard/client/projects/new">
                                    <Button variant="outline" className="border-[#f6941d] text-[#f6941d] hover:bg-orange-50">
                                        Créer mon premier projet
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {recentProjects.map((project) => (
                                <Card key={project.id} className="bg-white border-slate-100 hover:border-orange-200 hover:shadow-md transition-all group">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-[#f6941d] transition-colors">{project.title}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="outline" className="text-xs border-white/10 text-slate-500">{project.specs?.category || 'Général'}</Badge>
                                                <span className="text-xs text-slate-600 flex items-center">
                                                    {new Date(project.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={`
                                                        ${project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-amber-100 text-amber-700'}
                                                    `}>
                                                {project.status === 'pending_approval' ? 'Validation' :
                                                    project.status === 'open' ? 'Ouvert' :
                                                        project.status === 'in_progress' ? 'En cours' :
                                                            project.status === 'review' ? 'En revue' :
                                                                project.status === 'completed' ? 'Terminé' : project.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <div className="text-center pt-4">
                                <Link href="/dashboard/client/projects">
                                    <Button variant="link" className="text-[#f6941d] hover:text-orange-700 transition-colors font-bold">
                                        Voir tous mes projets <PlusCircle className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Tips */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#f6941d]" /> Conseils
                    </h2>
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg">Comment ça marche ?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-slate-300 text-sm">
                            <div className="flex gap-3">
                                <div className="bg-[#f6941d] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white">1</div>
                                <p>Postez une mission détaillée (Brief).</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-[#f6941d] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white">2</div>
                                <p>Nous validons votre projet sous 24h.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-[#f6941d] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white">3</div>
                                <p>Les diplômés certifiés postulent.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-[#f6941d] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white">4</div>
                                <p>Choisissez votre expert et démarrez !</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

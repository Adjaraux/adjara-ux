import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Search, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getClientProjects } from '@/app/actions/projects';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function ProjectsList() {
    const res = await getClientProjects();

    if (!res.success) {
        if (res.error === 'Unauthorized') redirect('/login');
        return <div className="p-8 text-center text-red-500">{res.error}</div>;
    }

    const projects = res.projects || [];

    if (projects.length === 0) {
        return (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">Aucun projet</h3>
                    <p className="text-slate-500 max-w-sm mt-2 mb-6">
                        Vous n'avez pas encore de mission en cours.
                    </p>
                    <Link href="/dashboard/client/projects/new">
                        <Button className="rounded-full px-8">Créer un projet</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-6">
            {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow rounded-3xl overflow-hidden border-slate-100">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">
                                {project.title}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Créé le {new Date(project.created_at).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <Badge className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase
                            ${project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-amber-100 text-amber-700'}
                        `}>
                            {project.status === 'pending_approval' ? 'En validation' :
                                project.status === 'open' ? 'Ouvert' :
                                    project.status === 'in_progress' ? 'En cours' :
                                        project.status === 'review' ? 'En revue' :
                                            project.status === 'completed' ? 'Terminé' : project.status}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {project.description}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {project.deadline ? `Livraison : ${new Date(project.deadline).toLocaleDateString()}` : 'Pas de date limite'}
                            </div>
                            <div className="font-bold text-slate-900">
                                {project.final_price ? `${project.final_price.toLocaleString()} XOF` : project.budget_range}
                            </div>
                        </div>
                        <Link href={`/dashboard/client/projects/${project.id}`}>
                            <Button variant="outline" className="w-full rounded-xl border-slate-200 hover:bg-slate-50">
                                Voir les détails
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default async function ClientProjectsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mes Projets</h1>
                    <p className="text-slate-500 mt-2">Suivez l'avancement de vos missions.</p>
                </div>
                <Link href="/dashboard/client/projects/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-lg shadow-indigo-100">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Nouveau Projet
                    </Button>
                </Link>
            </div>

            <ProjectsList />
        </div>
    );
}

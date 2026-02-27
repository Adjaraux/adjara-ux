import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowRight, MessageCircle } from "lucide-react";
import { getClientProjects } from "@/app/actions/projects";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function ClientMessagesPage() {
    const res = await getClientProjects();
    const projects = res.projects || [];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in h-[80vh] flex flex-col">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-8 h-8 text-indigo-600" />
                    Messagerie
                </h1>
                <p className="text-slate-500 mt-2">
                    Accédez aux discussions de vos projets en cours.
                </p>
            </div>

            {projects.length === 0 ? (
                <Card className="flex-1 border-dashed border-2 border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                        <MessageSquare className="w-12 h-12 text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun message pour le moment</h3>
                    <p className="text-slate-500 max-w-md">
                        Les discussions apparaîtront ici dès qu'un projet sera créé.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {projects.map((project) => (
                        <Link key={project.id} href={`/dashboard/client/projects/${project.id}?tab=chat`}>
                            <Card className="hover:shadow-md transition-all border-slate-100 group">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-50 p-3 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                                            <MessageCircle className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                Discussion : {project.title}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                Cliquez pour ouvrir la messagerie privée du projet
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-400">
                                            {project.status === 'pending_approval' ? 'En validation' :
                                                project.status === 'open' ? 'Ouvert' :
                                                    project.status === 'in_progress' ? 'En cours' :
                                                        project.status === 'review' ? 'En revue' :
                                                            project.status === 'completed' ? 'Terminé' : project.status}
                                        </Badge>
                                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Briefcase, Activity, MessageSquare, Wallet } from 'lucide-react';
import { getAdminDashboardStats } from '@/app/actions/admin-dashboard';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function AdminDashboard() {
    const { data: stats } = await getAdminDashboardStats();

    // Default values if fetch fails or is empty
    const openProjects = stats?.openProjects || 0;
    const inProgress = stats?.inProgressProjects || 0;
    const revenue = stats?.totalRevenue || 0;
    const totalUsers = stats?.totalUsers || 0;
    const activities = stats?.recentActivities || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Vue Globale</h1>
                <p className="text-slate-500 mt-2">Bienvenue dans le centre de contrôle d'Adjara.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500">Utilisateurs Totaux</div>
                            <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-50">
                            <Briefcase className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500">Projets Ouverts</div>
                            <div className="text-2xl font-bold text-slate-900">{openProjects}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-50">
                            <Activity className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500">En Cours</div>
                            <div className="text-2xl font-bold text-slate-900">{inProgress}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-50">
                            <Wallet className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500">Chiffre d'Affaires</div>
                            <div className="text-2xl font-bold text-slate-900">{formatCurrency(revenue)}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity (Messages) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                            Derniers Messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activities.length > 0 ? (
                            <div className="space-y-4">
                                {activities.map((act: any) => (
                                    <div key={act.id} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors p-2 rounded-lg">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={act.sender_avatar} />
                                            <AvatarFallback>{act.sender_name?.substring(0, 1) || '?'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium text-slate-900">{act.sender_name}</span>
                                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: fr })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-indigo-600 font-medium mb-1">{act.project_title}</p>
                                            <p className="text-sm text-slate-600 truncate">{act.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                Aucun message récent.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Links or Secondary Stats could go here */}
                <Card className="bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle>Actions Rapides</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-300">
                            Accédez rapidement aux fonctions clés pour gérer l'agence.
                        </p>
                        {/* Links would be client-side usually, but standard anchor tags work for server components or transition to client components if needed */}
                        {/* For now just info */}
                        <div className="text-xs space-y-2 opacity-80">
                            <div className="flex items-center gap-2">👉 Valider les projets en attente</div>
                            <div className="flex items-center gap-2">👉 Assigner les missions aux talents</div>
                            <div className="flex items-center gap-2">👉 Vérifier les livrables étudiants</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toggleUserStatus } from '@/app/actions/settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shieldalert, Briefcase, UserCheck, Loader2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserDetailSheet } from '@/components/admin/user-detail-sheet';

export default function AdminUsersPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [talents, setTalents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchData = async () => {
        setLoading(true);

        // 1. Fetch Clients with Agency Details & Project Counts
        // Note: Supabase JS select modifiers for complex joins/counts can be tricky.
        // We fetching profile fields + agency_clients(*) + counts.
        const { data: clientsData, error: clientError } = await supabase
            .from('profiles')
            .select(`
                *,
                agency_clients (*),
                projects:projects!client_id (id, status)
            `)
            .eq('role', 'client')
            .order('created_at', { ascending: false });

        if (clientError) console.error("Client Fetch Error:", clientError);

        // Process Counts for Clients
        const processedClients = clientsData?.map(c => ({
            ...c,
            projects_count: c.projects?.length || 0,
            active_projects_count: c.projects?.filter((p: any) => ['open', 'in_progress', 'review'].includes(p.status)).length || 0
        })) || [];


        // 2. Fetch Talents
        const { data: talentsData, error: talentError } = await supabase
            .from('profiles')
            .select(`
                *,
                projects:projects!assigned_talent_id (id, status)
            `)
            .in('role', ['eleve', 'student']) // Handle both just in case
            .order('created_at', { ascending: false });

        if (talentError) console.error("Talent Fetch Error:", talentError);

        // Process Counts for Talents
        const processedTalents = talentsData?.map(t => ({
            ...t,
            projects_count: t.projects?.length || 0,
            active_projects_count: t.projects?.filter((p: any) => ['in_progress', 'review'].includes(p.status)).length || 0
        })) || [];


        setClients(processedClients);
        setTalents(processedTalents);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleStatus = async (e: React.MouseEvent, userId: string, currentStatus: string) => {
        e.stopPropagation(); // Prevent row click
        const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
        const res = await toggleUserStatus(userId, newStatus);

        if (res.success) {
            toast.success(`Utilisateur ${newStatus === 'banned' ? 'banni' : 'réactivé'}`);
            fetchData(); // Refresh list
        } else {
            toast.error("Erreur: " + res.message);
        }
    };

    const openUserSheet = (user: any) => {
        setSelectedUser(user);
        setIsSheetOpen(true);
    };

    const UserTable = ({ users, type }: { users: any[], type: 'client' | 'talent' }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Activité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => openUserSheet(user)}
                    >
                        <TableCell className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>{user.full_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium">{user.full_name || user.email}</span>
                                {user.full_name && <span className="text-xs text-slate-500">{user.email}</span>}
                                <span className="text-[10px] text-slate-400">Inscrit le {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                            </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            {user.status === 'banned' ? (
                                <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" /> Banni</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 gap-1">
                                    <CheckCircle className="w-3 h-3" /> Actif
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                                <Badge variant="outline">
                                    {user.projects_count} {type === 'client' ? 'Projets' : 'Missions'}
                                </Badge>
                                {user.active_projects_count > 0 && (
                                    <span className="text-[10px] text-amber-600 font-semibold px-1 bg-amber-50 rounded">
                                        {user.active_projects_count} En cours
                                    </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(user.id); }}>
                                        Copier ID
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openUserSheet(user); }}>
                                        Voir Détails
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleToggleStatus(e, user.id, user.status || 'active')} className={user.status === 'banned' ? 'text-green-600' : 'text-red-600'}>
                                        {user.status === 'banned' ? 'Réactiver le compte' : 'Bannir le compte'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
                <p className="text-slate-500">Gérez les accès et suivez l'activité des membres.</p>
            </div>

            <Tabs defaultValue="clients" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="clients" className="flex gap-2"><Briefcase className="w-4 h-4" /> Clients ({clients.length})</TabsTrigger>
                    <TabsTrigger value="talents" className="flex gap-2"><UserCheck className="w-4 h-4" /> Talents Certifiés ({talents.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="clients">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clients Agence</CardTitle>
                            <CardDescription>Liste des entreprises et porteurs de projet.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserTable users={clients} type="client" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="talents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Talents Certifiés</CardTitle>
                            <CardDescription>Liste des élèves qualifiés pour les missions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserTable users={talents} type="talent" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <UserDetailSheet
                user={selectedUser}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        </div>
    );
}

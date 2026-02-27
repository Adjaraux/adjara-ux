'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ProjectChat } from '@/components/client/project-chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, MessageSquare, User, Phone, Mail, FileText, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { SpecsViewer } from '@/components/admin/specs-viewer';
import Link from 'next/link';

export default function AdminMessagesPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user);

            // Fetch Projects with Client and Messages metadata
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    id, 
                    title, 
                    description,
                    specs,
                    status,
                    created_at,
                    client:client_id(id, full_name, email, avatar_url, phone),
                    messages(created_at, sender_id, is_read, content)
                `)
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching projects:", error);
            } else {
                const processed = data.map((p: any) => {
                    const sortedMsgs = p.messages?.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ) || [];

                    const lastMsg = sortedMsgs[0];
                    const unreadCount = sortedMsgs.filter((m: any) => !m.is_read && m.sender_id !== user.id).length;

                    return {
                        ...p,
                        lastMessage: lastMsg,
                        unreadCount,
                        lastActivity: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(p.created_at).getTime()
                    };
                });

                processed.sort((a: any, b: any) => b.lastActivity - a.lastActivity);
                setProjects(processed);

                if (processed.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(processed[0].id);
                }
            }
            setLoading(false);
        }
        fetchData();
    }, [supabase, selectedProjectId]); // Re-fetch logic can be improved

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    if (loading) return <div className="flex justify-center h-[calc(100vh-200px)] items-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 animate-in fade-in">

            {/* LEFT SIDEBAR: Project List */}
            <Card className="w-full md:w-1/3 flex flex-col h-full border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-4 bg-slate-50/50">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-600" /> Messagerie</span>
                        <Badge variant="secondary" className="font-normal">{projects.length} discussions</Badge>
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher un client ou projet..."
                            className="pl-9 bg-white border-slate-200 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="divide-y divide-slate-100">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => setSelectedProjectId(project.id)}
                                className={`
                                    p-4 cursor-pointer transition-colors hover:bg-slate-50 group
                                    ${selectedProjectId === project.id ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    {/* Project Title with Sheet Trigger */}
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-semibold text-sm truncate ${selectedProjectId === project.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {project.title}
                                            </h4>

                                            {/* Technical Dossier Trigger (Clickable Icon) */}
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 text-slate-400 hover:text-indigo-600 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent selecting project again
                                                            // Sheet opens
                                                        }}
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                                                    <SheetHeader>
                                                        <SheetTitle>{project.title}</SheetTitle>
                                                        <SheetDescription>Dossier Technique & Cahier des Charges</SheetDescription>
                                                    </SheetHeader>
                                                    <div className="mt-6 space-y-6">
                                                        <div className="bg-slate-50 p-4 rounded-md text-sm whitespace-pre-wrap border border-slate-100">
                                                            {project.description}
                                                        </div>
                                                        <SpecsViewer specs={project.specs} />
                                                        <div className="pt-4 border-t">
                                                            <Link href={`/dashboard/client/projects/${project.id}`} target="_blank">
                                                                <Button variant="outline" className="w-full">
                                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                                    Voir la vue Client complète
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </div>

                                    {project.lastMessage && (
                                        <span className="text-[10px] text-slate-400 shrink-0">
                                            {formatDistanceToNow(new Date(project.lastMessage.created_at), { addSuffix: true, locale: fr })}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                                    <HoverCard>
                                        <HoverCardTrigger asChild>
                                            <div className="flex items-center gap-2 hover:bg-slate-100 p-1 -ml-1 rounded cursor-pointer transition-colors max-w-fit">
                                                <Avatar className="w-5 h-5">
                                                    <AvatarImage src={project.client?.avatar_url} />
                                                    <AvatarFallback className="text-[9px] bg-slate-200">
                                                        {project.client?.full_name?.substring(0, 2).toUpperCase() || 'CL'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-slate-500 truncate font-medium hover:text-indigo-600 hover:underline underline-offset-2">
                                                    {project.client?.full_name || 'Client Inconnu'}
                                                </span>
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80">
                                            <div className="flex justify-between space-x-4">
                                                <Avatar>
                                                    <AvatarImage src={project.client?.avatar_url} />
                                                    <AvatarFallback>{project.client?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-semibold">{project.client?.full_name}</h4>
                                                    <div className="flex items-center pt-2">
                                                        <Mail className="mr-2 h-4 w-4 opacity-70" />{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            {project.client?.email || 'Email masqué'}
                                                        </span>
                                                    </div>
                                                    {project.client?.phone && (
                                                        <div className="flex items-center">
                                                            <Phone className="mr-2 h-4 w-4 opacity-70" />{" "}
                                                            <span className="text-xs text-muted-foreground">
                                                                {project.client.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center pt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            Client Agence
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-400 truncate max-w-[200px] italic">
                                        {project.lastMessage ? project.lastMessage.content : 'Aucun message'}
                                    </p>
                                    {project.unreadCount > 0 && (
                                        <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0 h-5">
                                            {project.unreadCount}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* RIGHT MAIN: Chat Area */}
            <div className="flex-1 h-full flex flex-col">
                {selectedProject ? (
                    <div className="h-full flex flex-col">
                        <AdminChatWrapper projectId={selectedProject.id} currentUser={currentUser} key={selectedProject.id} />
                    </div>
                ) : (
                    <Card className="h-full flex items-center justify-center bg-slate-50 border-dashed border-2 border-slate-200">
                        <div className="text-center text-slate-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Sélectionnez une conversation pour commencer</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

// Wrapper to fetch full messages for the selected project
import { getProjectMessages } from '@/app/actions/messaging';

function AdminChatWrapper({ projectId, currentUser }: { projectId: string, currentUser: any }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const msgs = await getProjectMessages(projectId);
            setMessages(msgs);
            setLoading(false);
        }
        load();
    }, [projectId]);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <ProjectChat
            projectId={projectId}
            currentUser={currentUser}
            initialMessages={messages}
        />
    );
}


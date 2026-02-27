'use client';

import { confirmProjectReceiptAction } from '@/app/actions/agency';
import { getProjectMessages } from '@/app/actions/messaging';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    Download,
    CheckCircle,
    AlertCircle,
    Loader2,
    MessageSquare
} from 'lucide-react';
import { SpecsViewer } from '@/components/admin/specs-viewer';
import { toast } from 'sonner';
import { getSignedUrlAction } from '@/app/actions/storage';
import { ProjectChat } from '@/components/client/project-chat';
import { PaymentMethodSelector } from '@/components/client/payment-method-selector';
import { DownloadReceiptButton } from '@/components/client/download-receipt-button';

import { Suspense } from 'react';

function ProjectDetailsContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'overview';

    const [project, setProject] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user);

            // 1. Fetch Project
            const { data: projectData, error } = await supabase
                .from('projects')
                .select('*, project_deliverables(*)')
                .eq('id', params.id)
                .eq('client_id', user.id)
                .single();

            if (error) {
                console.error("Error fetching project:", error);
                // Handle 404 or auth error
            } else {
                setProject(projectData);
                // 2. Fetch Messages
                const msgs = await getProjectMessages(projectData.id);
                setMessages(msgs);

                // 3. Fetch Transaction (if paid)
                if (['open', 'in_progress', 'review', 'completed'].includes(projectData.status)) {
                    const { data: tx } = await supabase
                        .from('agency_transactions')
                        .select('id')
                        .eq('project_id', projectData.id)
                        .eq('status', 'success')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    if (tx) setTransactionId(tx.id);
                }
            }
            setLoading(false);
        }
        fetchData();
    }, [params.id, supabase]);

    const handleDownload = async (fileUrl: string, fileName: string) => {
        toast.loading(`Téléchargement de ${fileName}...`);
        const res = await getSignedUrlAction(fileUrl, project.id);
        toast.dismiss();

        if (res.success && res.signedUrl) {
            window.open(res.signedUrl, '_blank');
        } else {
            toast.error("Erreur téléchargement : " + res.message);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

    if (!project) return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold text-slate-800">Projet introuvable</h2>
            <Link href="/dashboard/client/projects">
                <Button variant="link">Retour à mes projets</Button>
            </Link>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-12">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/client/projects">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <Badge variant="outline" className={`font-normal uppercase tracking-wider text-xs ${project.status === 'pending_approval' && project.final_price ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}`}>
                            {project.status === 'pending_approval' ? (project.final_price ? 'Devis Envoyé' : 'En attente') :
                                project.status === 'open' ? 'Validé' :
                                    project.status === 'in_progress' ? 'En cours' :
                                        project.status === 'review' ? 'Validation Agence' :
                                            project.status === 'delivered' ? 'Livré' :
                                                project.status === 'completed' ? 'Terminé' : project.status}
                        </Badge>
                        <span>•</span>
                        <span>Dernière maj : {new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue={initialTab} className="space-y-6">
                <TabsList className={`grid w-full ${['open', 'in_progress', 'review', 'delivered', 'completed'].includes(project.status) ? 'grid-cols-2 max-w-[400px]' : 'grid-cols-1 max-w-[200px]'}`}>
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    {['open', 'in_progress', 'review', 'delivered', 'completed'].includes(project.status) && (
                        <TabsTrigger value="chat" className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Discussion
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* LEFT: Main Content */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Description */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold text-slate-800">Votre Demande</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-md text-sm text-slate-700 whitespace-pre-wrap">
                                        {project.description}
                                    </div>

                                    {/* Specs Viewer */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Spécifications Techniques</h4>
                                        <SpecsViewer specs={project.specs} />
                                    </div>

                                    {/* Attachments */}
                                    {project.attachments && project.attachments.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Pièces Jointes</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {project.attachments.map((file: any, i: number) => (
                                                    <div key={i} onClick={() => handleDownload(file.url, file.name)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md text-xs hover:bg-slate-200 transition-colors cursor-pointer">
                                                        <FileText className="w-3 h-3" />
                                                        {file.name}
                                                        <Download className="w-3 h-3 ml-1 text-slate-400" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* CONFIRMATION ACTION */}
                            {project.status === 'delivered' && (
                                <Card className="border-green-500 bg-green-50 shadow-md animate-in slide-in-from-bottom-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                                            <CheckCircle className="w-6 h-6" /> Livraison Effectuée
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-green-800 text-sm">
                                            L'agence a marqué cette mission comme livrée.
                                            Veuillez confirmer que vous avez bien reçu le service/produit attendu.
                                            Cette action clôturera le projet.
                                        </p>
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
                                            onClick={async () => {
                                                toast.loading("Confirmation en cours...");
                                                const res = await confirmProjectReceiptAction(project.id);
                                                if (res.success) {
                                                    toast.success("Réception confirmée ! Projet clôturé.");
                                                    setProject({ ...project, status: 'completed' });
                                                } else {
                                                    toast.error(res.message || "Erreur.");
                                                }
                                            }}
                                        >
                                            Confirmer la Réception
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {project.status === 'completed' && (
                                <Card className="border-slate-200 bg-slate-50 opacity-80">
                                    <CardContent className="p-4 flex items-center gap-4 text-slate-500">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Projet clôturé le {new Date(project.updated_at).toLocaleDateString()}</span>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* RIGHT: Financials & Status */}
                        <div className="space-y-6">
                            <Card className="bg-slate-900 text-white border-none shadow-lg">
                                <CardContent className="p-6">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget / Devis</h3>
                                    <div className="text-3xl font-bold mb-4">
                                        {project.final_price ? `${project.final_price.toLocaleString()} FCFA` : project.budget_range}
                                    </div>

                                    {project.final_price ? (
                                        <div className="space-y-3">
                                            <Badge className="bg-green-500 text-white hover:bg-green-600 border-none w-full justify-center py-1">
                                                {transactionId ? 'Paiement Validé' : 'Prix Fixé'}
                                            </Badge>

                                            {transactionId ? (
                                                <DownloadReceiptButton
                                                    transactionId={transactionId}
                                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white border-none h-10"
                                                />
                                            ) : (
                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    Le prix a été validé par l'agence. Vous pouvez maintenant procéder au règlement.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <Badge variant="outline" className="text-amber-400 border-amber-400/50 w-full justify-center py-1">
                                                Estimation
                                            </Badge>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                L'agence étudie votre demande pour fixer un prix définitif.
                                            </p>
                                        </div>
                                    )}

                                    <Separator className="bg-slate-700 my-4" />

                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <div className="bg-slate-800 p-2 rounded-md">
                                            <Calendar className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Livraison Estimée</p>
                                            <p className="font-bold text-white">
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date non fixée'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline / Steps */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase">Suivi</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                                    {[
                                        { status: 'pending_approval', label: 'Demande reçue', done: true },
                                        { status: 'open', label: 'Validation Agence', done: project.status !== 'pending_approval' && project.status !== 'cancelled' },
                                        { status: 'in_progress', label: 'Réalisation en cours', done: ['in_progress', 'review', 'completed'].includes(project.status) },
                                        { status: 'review', label: 'Livraison & Vérification', done: ['review', 'completed'].includes(project.status) },
                                        { status: 'completed', label: 'Projet Terminé', done: project.status === 'completed' }
                                    ].map((step, i) => (
                                        <div key={i} className="relative flex items-center gap-3 pl-2">
                                            <div className={`
                                                w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2
                                                ${(i === 0 || (step.status === 'open' && project.status !== 'pending_approval' && project.status !== 'draft') || project.status === 'completed' || step.done) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-300'}
                                            `}>
                                                {/* Correct logic for stepper checkmarks */}
                                                {(step.done || project.status === 'completed') && <CheckCircle className="w-3 h-3" />}
                                            </div>
                                            <span className={`text-sm ${step.done ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* PAYMENT SELECTOR (Phase 3) */}
                            {project.status === 'pending_approval' && project.final_price && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <PaymentMethodSelector
                                        projectId={project.id}
                                        amount={project.final_price}
                                        currency={project.currency || 'XOF'}
                                        projectTitle={project.title}
                                    />
                                </div>
                            )}

                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: CHAT */}
                <TabsContent value="chat">
                    <ProjectChat
                        projectId={project.id}
                        currentUser={currentUser}
                        initialMessages={messages}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ClientProjectDetailsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>}>
            <ProjectDetailsContent />
        </Suspense>
    );
}

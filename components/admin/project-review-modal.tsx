'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProjectStatusAction } from '@/app/actions/agency';
import { assignProjectAction, getCalculatedTalents } from '@/app/actions/admin-projects';
import { getSignedUrlAction } from '@/app/actions/storage';
import { suggestTalentsForProject } from '@/app/actions/scoring';
import { SpecsViewer } from './specs-viewer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, FileText, Download, UserPlus, Calendar, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectReviewModalProps {
    project: any; // Type Project ideally
    trigger?: React.ReactNode;
}

export function ProjectReviewModal({ project, trigger }: ProjectReviewModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Approval State
    const [finalPrice, setFinalPrice] = useState<string>('');
    const [rejectReason, setRejectReason] = useState('');

    // Assignment State
    const [talents, setTalents] = useState<any[]>([]);
    const [selectedTalent, setSelectedTalent] = useState<string>('');
    const [deadline, setDeadline] = useState<string>(''); // YYYY-MM-DD
    const [adminNotes, setAdminNotes] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

    const [mode, setMode] = useState<'view' | 'approve' | 'reject' | 'assign'>('view');

    useEffect(() => {
        if (open && mode === 'assign') {
            // Load all talents
            if (talents.length === 0) {
                getCalculatedTalents().then(data => setTalents(data));
            }
            // Load AI Suggestions
            suggestTalentsForProject(project.id).then(data => setAiSuggestions(data));
        }
    }, [open, mode, project.id]);

    const handleApprove = async () => {
        if (!finalPrice || isNaN(Number(finalPrice))) {
            toast.error("Veuillez définir un prix final valide.");
            return;
        }
        if (!deadline) {
            toast.error("Veuillez définir une date de livraison estimée.");
            return;
        }

        setLoading(true);
        try {
            console.log("Approving project:", project.id, "Price:", finalPrice, "Deadline:", deadline);
            const res = await updateProjectStatusAction({
                projectId: project.id,
                status: 'pending_approval',
                finalPrice: Number(finalPrice),
                deadline: new Date(deadline)
            });

            if (res.success) {
                toast.success("Devis envoyé au client ! (En attente de paiement)");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Erreur technique.");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) {
            toast.error("Motif de refus requis.");
            return;
        }
        setLoading(true);
        try {
            const res = await updateProjectStatusAction({
                projectId: project.id,
                status: 'cancelled', // Or 'rejected'
                adminNotes: rejectReason
            });
            if (res.success) {
                toast.success("Projet refusé.");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Erreur lors du refus.");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedTalent) return toast.error("Veuillez sélectionner un talent.");
        if (!deadline) return toast.error("Veuillez fixer une deadline.");

        setLoading(true);
        try {
            const res = await assignProjectAction({
                projectId: project.id,
                talentId: selectedTalent,
                deadline: new Date(deadline),
                adminNotes: adminNotes
            });

            if (res.success) {
                toast.success("Mission attribuée !");
                setOpen(false);
                router.refresh(); // UPDATE UI
            } else {
                toast.error(res.message || "Erreur d'attribution");
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur technique.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setMode('view');
        setFinalPrice('');
        setRejectReason('');
        setSelectedTalent('');
        setDeadline('');
        setAdminNotes('');
    };

    const router = useRouter(); // Add Refresh Trigger

    const handleUpdateStatus = async (status: 'delivered' | 'completed' | 'in_progress', notes?: string) => {
        setLoading(true);
        try {
            const res = await updateProjectStatusAction({
                projectId: project.id,
                status,
                adminNotes: notes
            });

            if (res.success) {
                toast.success(`Statut mis à jour : ${status}`);
                setOpen(false);
                router.refresh(); // INSTANT UPDATE
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Erreur technique.");
        } finally {
            setLoading(false);
        }
    };



    // ... inside component ...

    const handleDownload = async (fileUrl: string, fileName: string) => {
        toast.loading(`Téléchargement de ${fileName}...`);
        const res = await getSignedUrlAction(fileUrl, project.id);
        toast.dismiss();

        if (res.success && res.signedUrl) {
            window.open(res.signedUrl, '_blank');
        } else {
            toast.error("Impossible de télécharger le fichier.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>{trigger || <Button variant="outline">Review</Button>}</DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                {project.title}
                                <Badge variant={
                                    project.status === 'pending_approval' ? 'destructive' :
                                        project.status === 'open' ? 'default' :
                                            project.status === 'in_progress' ? 'secondary' : 'outline'
                                }>
                                    {project.status}
                                </Badge>
                            </DialogTitle>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span className="font-semibold text-slate-900">
                                        {project.agency_clients?.company_name || 'Client Inconnu'}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                        {project.agency_clients?.client_type === 'individual' ? 'Particulier' : 'Entreprise'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    {project.agency_clients?.email && <span>📧 {project.agency_clients.email}</span>}
                                    {project.agency_clients?.phone && <span>📞 {project.agency_clients.phone}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400 uppercase font-bold">Budget Client</span>
                            <div className="text-lg font-bold text-slate-800">{project.budget_range}</div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    {/* LEFT: Project Details (2 cols) */}
                    <div className="md:col-span-2">
                        <Tabs defaultValue="specs" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="specs">Cahier des Charges</TabsTrigger>
                                <TabsTrigger value="client">Fiche Client</TabsTrigger>
                            </TabsList>

                            <TabsContent value="specs" className="space-y-6">
                                <section>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Description</h4>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-md border border-slate-100">
                                        {project.description}
                                    </p>
                                </section>

                                <SpecsViewer specs={project.specs} />

                                {project.attachments && project.attachments.length > 0 && (
                                    <section>
                                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Pièces Jointes</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {project.attachments.map((file: any, i: number) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleDownload(file.url, file.name)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md text-xs hover:bg-slate-200 transition-colors"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    {file.name}
                                                    <Download className="w-3 h-3 ml-1 text-slate-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Deliverables Section (If any) */}
                                {project.project_deliverables && project.project_deliverables.length > 0 && (
                                    <section className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg animate-in slide-in-from-bottom-2">
                                        <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Livrables Soumis
                                        </h4>
                                        <div className="space-y-2">
                                            {project.project_deliverables.map((del: any) => (
                                                <div key={del.id} className="bg-white p-3 rounded border border-emerald-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-emerald-100 p-2 rounded text-emerald-600">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 truncate">{del.file_name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {new Date(del.created_at).toLocaleString()}
                                                            </p>
                                                            {del.comment && <p className="text-xs text-emerald-700 italic mt-1">"{del.comment}"</p>}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8"
                                                        onClick={() => handleDownload(del.file_url, del.file_name)}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </TabsContent>

                            <TabsContent value="client" className="space-y-6 animate-in fade-in slide-in-from-left-2">
                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300">
                                            {project.agency_clients?.logo_url ? (
                                                <img src={project.agency_clients.logo_url} alt="Logo" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <UserPlus className="w-8 h-8" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{project.agency_clients?.company_name}</h3>
                                            <Badge variant="outline">{project.agency_clients?.client_type}</Badge>
                                            <p className="text-sm text-slate-500 mt-1">{project.agency_clients?.industry || 'Industrie non spécifiée'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">Email Contact</label>
                                            <div className="font-medium text-slate-800">{project.agency_clients?.email || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">Téléphone</label>
                                            <div className="font-medium text-slate-800">{project.agency_clients?.phone || 'N/A'}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Site Web</label>
                                            <div className="font-medium text-indigo-600 truncate">
                                                {project.agency_clients?.website_url ? (
                                                    <a href={project.agency_clients.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {project.agency_clients.website_url}
                                                    </a>
                                                ) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Indication Facturation</label>
                                            <div className="font-medium text-slate-800">
                                                {project.agency_clients?.address || 'Adresse non renseignée'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Assignment Info (Global) */}
                        {((project.status === 'in_progress' || project.status === 'review' || project.status === 'completed') && project.deadline) && (
                            <div className="mt-6 bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex gap-4 items-center">
                                <Calendar className="w-8 h-8 text-indigo-500" />
                                <div>
                                    <h4 className="font-bold text-indigo-900">Mission en cours</h4>
                                    <p className="text-sm text-indigo-700">
                                        Attribuée à <strong>{project.assignee?.full_name || 'Talent'}</strong><br />
                                        Deadline : {new Date(project.deadline).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Action & Pricing (1 col) */}
                    <div className="space-y-6 border-l pl-6 border-slate-100">

                        {/* Status Actions */}

                        {/* 1. COMPLETED */}
                        {project.status === 'completed' && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                <h3 className="font-bold text-green-800 text-lg">Mission Terminée</h3>
                                <p className="text-sm text-green-700 mt-1">Mission archivée.</p>
                                <Separator className="my-3 bg-green-200" />
                                <div className="text-xs text-green-800">
                                    <strong>Prix Final :</strong> {project.final_price} FCFA
                                </div>
                            </div>
                        )}

                        {/* 2. REVIEW (New State) */}
                        {project.status === 'review' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 text-center">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-indigo-600">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-indigo-900">Livrables Reçus</h3>
                                    <p className="text-sm text-indigo-700 mb-2">
                                        L'élève a soumis son travail. Vérifiez les fichiers ci-contre.
                                    </p>
                                </div>
                                <Button className="w-full bg-green-600 hover:bg-green-700 h-12" onClick={() => {
                                    // Direct Approve
                                    toast.promise(updateProjectStatusAction({
                                        projectId: project.id,
                                        status: 'completed'
                                    }), {
                                        loading: 'Validation...',
                                        success: () => {
                                            setOpen(false);
                                            return "Mission validée & terminée !";
                                        },
                                        error: 'Erreur'
                                    });
                                }}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Valider Mission
                                </Button>
                                <Button variant="outline" className="w-full text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => {
                                    // Request Changes (Back to In Progress)
                                    const reason = prompt("Motif du refus (sera envoyé à l'élève) :");
                                    if (reason) {
                                        toast.promise(updateProjectStatusAction({
                                            projectId: project.id,
                                            status: 'in_progress',
                                            adminNotes: reason
                                        }), {
                                            loading: 'Renvoi...',
                                            success: () => {
                                                setOpen(false);
                                                return "Renvoyé à l'élève pour correction.";
                                            },
                                            error: 'Erreur'
                                        });
                                    }
                                }}>
                                    <XCircle className="w-4 h-4 mr-2" /> Demander Corrections
                                </Button>
                            </div>
                        )}

                        {/* 3. OPEN */}
                        {project.status === 'open' && (
                            <div className="space-y-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-bold text-green-800">Mission Validée</h3>
                                    <p className="text-sm text-green-700 mt-1">Prix Final: {project.final_price} FCFA</p>
                                </div>
                                <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={() => setMode('assign')}>
                                    <UserPlus className="w-4 h-4 mr-2" /> Attribuer Mission
                                </Button>
                            </div>
                        )}
                        {/* ACTION: Deliver to Client (Autonomy - No Student Needed) */}
                        {['open', 'in_progress', 'review'].includes(project.status) && (
                            <div className="pt-4 border-t border-slate-100">
                                <Button
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                    onClick={() => handleUpdateStatus('delivered')}
                                    disabled={loading}
                                >
                                    🚀 Livrer au Client
                                </Button>
                                <p className="text-[10px] text-center text-slate-400 mt-1">
                                    Notifie le client que la commande est prête (Même sans élève).
                                </p>
                            </div>
                        )}

                        {/* ACTION: Validate (Internal -> Completed? No, use Delivered now) */}
                        {/* We keep 'completed' as manual override if needed */}

                        {/* 4. PENDING */}
                        {project.status === 'pending_approval' && (
                            <div className="space-y-4">
                                {mode === 'view' && (
                                    <>
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-800 text-sm mb-4">
                                            Cette mission est en attente. Vérifiez les specs et le budget avant de valider.
                                        </div>
                                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setMode('approve')}>
                                            <CheckCircle className="w-4 h-4 mr-2" /> Valider & Chiffrer
                                        </Button>
                                        <Button className="w-full" variant="destructive" onClick={() => setMode('reject')}>
                                            <XCircle className="w-4 h-4 mr-2" /> Rejeter
                                        </Button>
                                    </>
                                )}

                                {mode === 'approve' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="price" className="text-green-700 font-bold">Prix Final (FCFA) <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <Input
                                                        id="price"
                                                        type="number"
                                                        placeholder="Ex: 150000"
                                                        value={finalPrice}
                                                        onChange={(e) => setFinalPrice(e.target.value)}
                                                        className="pl-8 text-lg font-bold border-green-200 focus:border-green-500 ring-green-100"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">F</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="quoteDate" className="text-green-700 font-bold">Livraison Estimée <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="quoteDate"
                                                    type="date"
                                                    value={deadline}
                                                    onChange={(e) => setDeadline(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="border-green-200 focus:border-green-500 ring-green-100"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Budget Client: <span className="font-medium text-slate-900">{project.budget_range}</span>
                                        </p>

                                        <div className="flex gap-2">
                                            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={loading}>
                                                {loading ? <Loader2 className="animate-spin" /> : "Confirmer le Devis"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setMode('view')} disabled={loading}>Annuler</Button>
                                        </div>
                                    </div>
                                )}

                                {mode === 'reject' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2">
                                            <Label htmlFor="reason">Motif du refus</Label>
                                            <Textarea
                                                id="reason"
                                                placeholder="Ex: Specs incomplètes, budget irréaliste..."
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button className="flex-1" variant="destructive" onClick={handleReject} disabled={loading}>
                                                {loading ? <Loader2 className="animate-spin" /> : "Refuser"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setMode('view')} disabled={loading}>Annuler</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* 5. IN PROGRESS (Simple Status) */}
                        {project.status === 'in_progress' && (
                            <div className="text-center text-slate-500 italic bg-slate-50 p-4 rounded-lg">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                                Mission en cours d'exécution.
                                {project.admin_notes && (
                                    <div className="mt-2 text-xs text-amber-600 border-t border-slate-200 pt-2">
                                        <strong>Dernière note :</strong> {project.admin_notes}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ASSIGN MODE */}
                        {mode === 'assign' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 border-t border-slate-100 pt-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" /> Attribution Mission
                                </h3>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label>Choisir le Talent (Diplômé)</Label>
                                        <Select value={selectedTalent} onValueChange={setSelectedTalent}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                                            <SelectContent>
                                                {talents.map((t: any) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.full_name || t.email} ({t.specialty})
                                                    </SelectItem>
                                                ))}
                                                {talents.length === 0 && <div className="p-2 text-xs text-slate-400">Aucun diplômé trouvé.</div>}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Date Limite (Deadline)</Label>
                                        <Input
                                            type="date"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Note Admin (Interne)</Label>
                                        <Textarea
                                            placeholder="Notes pour suivi..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            className="h-20 text-xs"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleAssign} disabled={loading}>
                                            {loading ? <Loader2 className="animate-spin" /> : "Valider Attribution"}
                                        </Button>
                                        <Button variant="ghost" onClick={() => setMode('view')} disabled={loading}>Annuler</Button>
                                    </div>
                                </div>

                                {/* AI SUGGESTIONS SECTION 🧠 */}
                                {aiSuggestions.length > 0 && (
                                    <div className="mt-6 space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-700">
                                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                                            <TrendingUp className="w-4 h-4" />
                                            Placement IA : Suggestions Optimales
                                        </div>
                                        <div className="space-y-2">
                                            {aiSuggestions.map((s) => (
                                                <div
                                                    key={s.talentId}
                                                    onClick={() => setSelectedTalent(s.talentId)}
                                                    className={`
                                                        p-3 rounded-lg border flex flex-col gap-1 cursor-pointer transition-all
                                                        ${selectedTalent === s.talentId ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600' : 'bg-white/50 border-white hover:border-indigo-300'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-slate-900 text-sm">{s.fullName}</span>
                                                        <Badge className="bg-indigo-600">{s.score}%</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {s.reasons.map((r: string, i: number) => (
                                                            <span key={i} className="text-[10px] text-indigo-700 bg-indigo-100 rounded px-1.5 py-0.5">
                                                                {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}

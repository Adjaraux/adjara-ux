'use client';

import { useState } from 'react';
import { deleteInscriptionAction } from '@/app/actions/delete-inscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, Trash2, Eye, Calendar, Mail, Phone, RefreshCcw, BookOpen, Briefcase, GraduationCap, MessageSquare } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function InscriptionsClient({ initialData }: { initialData: any[] }) {
    const [inscriptions, setInscriptions] = useState<any[]>(initialData);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const loadInscriptions = async () => {
        setIsRefreshing(true);
        router.refresh();
        // The parent server component will re-pass initialData
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Voulez-vous vraiment supprimer cette demande ?')) return;

        setDeletingId(id);
        const res = await deleteInscriptionAction(id);
        if (res.success) {
            toast.success("Demande supprimée");
            setInscriptions(inscriptions.filter(i => i.id !== id));
        } else {
            toast.error("Erreur lors de la suppression");
        }
        setDeletingId(null);
    };

    const selectedInscription = inscriptions.find(i => i.id === selectedId);

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-indigo-600" />
                        Liste des Messages
                    </CardTitle>
                    <CardDescription>Messages récupérés de la table inscriptions.</CardDescription>
                </div>
                <Button onClick={loadInscriptions} variant="outline" size="sm" className="gap-2">
                    <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {inscriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="font-bold">Date</TableHead>
                                    <TableHead className="font-bold">Contact</TableHead>
                                    <TableHead className="font-bold">Type</TableHead>
                                    <TableHead className="font-bold">Détails Formation</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inscriptions.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="hover:bg-slate-50 cursor-pointer group transition-colors"
                                        onClick={() => setSelectedId(item.id)}
                                    >
                                        <TableCell className="text-slate-500 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{item.nom}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {item.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={item.type_projet === 'formation' ? 'default' : 'secondary'}
                                                className={item.type_projet === 'formation' ? 'bg-indigo-600' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}
                                            >
                                                {item.type_projet === 'formation' ? '📚 Formation' : '💼 Prestation'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.type_projet === 'formation' ? (
                                                <div className="text-xs space-y-1">
                                                    <div className="text-slate-700 font-medium capitalize">{item.branche}</div>
                                                    <div className="text-slate-400 italic">Pack {item.duree_pack} mois</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-indigo-600">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => handleDelete(item.id, e)}
                                                    disabled={deletingId === item.id}
                                                >
                                                    {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Aucune demande</h3>
                        <p className="text-slate-500 text-sm">Les messages apparaîtront ici quand quelqu'un remplira le formulaire.</p>
                    </div>
                )}
            </CardContent>

            {/* DETAIL DIALOG */}
            <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
                <DialogContent className="max-w-2xl bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                    {selectedInscription && (
                        <>
                            <DialogHeader className="p-8 pb-0">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-4 rounded-2xl ${selectedInscription.type_projet === 'formation' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {selectedInscription.type_projet === 'formation' ? <BookOpen /> : <Briefcase />}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-bold text-slate-900">{selectedInscription.nom}</DialogTitle>
                                        <DialogDescription className="text-slate-500 font-medium">Demande reçue le {new Date(selectedInscription.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <ScrollArea className="max-h-[70vh] p-8 pt-4">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Email</p>
                                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-indigo-500" />
                                                {selectedInscription.email}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Téléphone</p>
                                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-emerald-500" />
                                                {selectedInscription.telephone || 'Non renseigné'}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedInscription.type_projet === 'formation' && (
                                        <div className="p-6 bg-indigo-600 text-white rounded-2xl shadow-lg relative overflow-hidden">
                                            <div className="absolute right-0 top-0 opacity-10 -mr-8 -mt-8">
                                                <GraduationCap className="w-40 h-40" />
                                            </div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-4">Détails Formation</h4>
                                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                                <div>
                                                    <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Spécialité</p>
                                                    <p className="text-lg font-bold capitalize">{selectedInscription.branche}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Option / Pack</p>
                                                    <p className="text-lg font-bold">{selectedInscription.duree_pack} Mois</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-slate-400" />
                                            Contenu du Message
                                        </h4>
                                        <div className="p-6 bg-slate-50 rounded-2xl text-slate-700 leading-relaxed text-sm whitespace-pre-wrap border border-slate-100">
                                            {selectedInscription.message || "Aucun détail complémentaire fourni."}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <Button className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl" onClick={() => window.location.href = `mailto:${selectedInscription.email}`}>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Répondre par Email
                                        </Button>
                                        <Button variant="outline" className="h-12 border-slate-200 text-slate-600 font-bold rounded-xl px-6" onClick={() => setSelectedId(null)}>
                                            Fermer
                                        </Button>
                                    </div>
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}

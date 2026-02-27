'use client';

import { useState, useEffect } from 'react';
import { getAdminAttempts, getAdminAttemptDetails } from '@/app/actions/admin-quiz';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Eye, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function AdminAttemptsPage() {
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
    const [details, setDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        loadAttempts();
    }, []);

    const loadAttempts = async () => {
        setLoading(true);
        try {
            const res = await getAdminAttempts();

            if (res.success && res.attempts) {
                setAttempts(res.attempts);
            } else {
                toast.error(`Erreur: ${res.error}`);
            }
        } catch (err) {
            // Error handled by toast
        }
        setLoading(false);
    };

    const handleViewDetails = async (id: string) => {
        setSelectedAttemptId(id);
        setLoadingDetails(true);
        setDetails(null);

        const res = await getAdminAttemptDetails(id);
        if (res.success) {
            setDetails(res);
        } else {
            alert("Erreur: " + res.error);
            setSelectedAttemptId(null);
        }
        setLoadingDetails(false);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('fr-FR');
    };

    const formatDuration = (start: string, end: string) => {
        if (!end) return 'En cours...';
        const ms = new Date(end).getTime() - new Date(start).getTime();
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        return `${min}m ${sec}s`;
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Suivi des Examens</h1>
                    <p className="text-slate-500">Monitorez les tentatives et analyisez les résultats.</p>
                </div>
                <Button onClick={loadAttempts} variant="outline">
                    <Clock className="w-4 h-4 mr-2" /> Actualiser
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historique Récent</CardTitle>
                    <CardDescription>Les 50 dernières tentatives d'examen.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Élève</TableHead>
                                    <TableHead>Examen</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Durée</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attempts.map((attempt) => (
                                    <TableRow key={attempt.id}>
                                        <TableCell>
                                            <div className="font-medium">{attempt.user_name}</div>
                                            <div className="text-xs text-slate-500">{attempt.user_email}</div>
                                        </TableCell>
                                        <TableCell>{attempt.lesson_title}</TableCell>
                                        <TableCell>{formatDate(attempt.started_at)}</TableCell>
                                        <TableCell>
                                            {attempt.is_active ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Cours</Badge>
                                            ) : attempt.passed ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Validé</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Échoué</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {attempt.completed_at ? `${attempt.score} pts` : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {formatDuration(attempt.started_at, attempt.completed_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(attempt.id)}>
                                                <Eye className="w-4 h-4 text-slate-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {attempts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            Aucune tentative enregistrée.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* DETAILS DIALOG */}
            <Dialog open={!!selectedAttemptId} onOpenChange={(open) => !open && setSelectedAttemptId(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Détail de la Tentative</DialogTitle>
                        <DialogDescription>
                            Analyse des réponses de l'élève.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingDetails ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>
                    ) : details ? (
                        <div className="flex-1 overflow-hidden flex flex-col gap-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="text-center px-4 border-r">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Score</div>
                                    <div className={`text-2xl font-bold ${details.attempt.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {details.attempt.score}
                                    </div>
                                </div>
                                <div className="text-center px-4 border-r">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Résultat</div>
                                    <div className={`font-medium ${details.attempt.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {details.attempt.passed ? 'ADMIS' : 'REFUSÉ'}
                                    </div>
                                </div>
                                <div className="text-center px-4">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Durée</div>
                                    <div className="font-mono text-slate-700">
                                        {formatDuration(details.attempt.started_at, details.attempt.completed_at)}
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                    {details.details.map((d: any, i: number) => (
                                        <div key={i} className={`p-4 rounded-lg border ${d.is_correct ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                                            <div className="flex gap-3">
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${d.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900 mb-2">{d.question}</p>

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Réponse Élève</span>
                                                            <div className={`flex items-center gap-2 ${d.is_correct ? 'text-emerald-700' : 'text-red-600 font-medium'}`}>
                                                                {d.is_correct ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                                {d.user_answer}
                                                            </div>
                                                        </div>
                                                        {!d.is_correct && (
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Bonne Réponse</span>
                                                                <div className="text-slate-700 flex items-center gap-2">
                                                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                                    {d.correct_answer}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-red-500">Impossible de charger les détails.</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

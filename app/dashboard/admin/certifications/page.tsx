'use client';

import { useState, useEffect } from 'react';
import { getAdminCertificates, getCertificateDownloadUrl, getEligibleStudents } from '@/app/actions/admin-certifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Award, Search, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCertificationsPage() {
    const [certs, setCerts] = useState<any[]>([]);
    const [eligible, setEligible] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (loading && certs.length > 0) return; // Prevent double load if already loading data
        setLoading(true);
        console.log("DEBUG [CertPage]: Loading data...");
        try {
            const [resCerts, resEligible] = await Promise.all([
                getAdminCertificates(),
                getEligibleStudents()
            ]);

            console.log("DEBUG [CertPage]: getAdminCertificates =>", resCerts.success, resCerts.certificates?.length || 0, "certs");
            console.log("DEBUG [CertPage]: getEligibleStudents =>", resEligible.success, resEligible.eligible?.length || 0, "eligible");

            if (resCerts.success && resCerts.certificates) {
                setCerts(resCerts.certificates);
            } else if (resCerts.error) {
                toast.error(`Erreur Certificats: ${resCerts.error}`);
            }

            if (resEligible.success && resEligible.eligible) {
                setEligible(resEligible.eligible);
            } else if (resEligible.error) {
                toast.error(`Erreur Éligibilité: ${resEligible.error}`);
            }
        } catch (err: any) {
            console.error("DEBUG [CertPage]: Load Error =>", err);
            toast.error(`Erreur de chargement: ${err.message}`);
        }
        setLoading(false);
    };

    const handleDownload = async (path: string, id: string) => {
        setDownloadingId(id);
        const url = await getCertificateDownloadUrl(path);
        if (url) {
            window.open(url, '_blank');
        } else {
            toast.error("Impossible de générer le lien de téléchargement.");
        }
        setDownloadingId(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Certifications Officielles 🎓</h1>
                    <p className="text-slate-500">Gérez les diplômes délivrés par l'Académie.</p>
                </div>
                <Button onClick={loadData} variant="outline" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    Actualiser
                </Button>
            </div>

            <Tabs defaultValue="delivered" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
                    <TabsTrigger value="delivered" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                        Certificats Délivrés ({certs.length})
                    </TabsTrigger>
                    <TabsTrigger value="eligible" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                        Étudiants Éligibles ({eligible.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="delivered">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle>Derniers Diplômés</CardTitle>
                            <CardDescription>Liste des étudiants ayant déjà généré leur diplôme.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Étudiant</TableHead>
                                            <TableHead>Cursus / Spécialité</TableHead>
                                            <TableHead>Cours de Référence</TableHead>
                                            <TableHead>Note Finale</TableHead>
                                            <TableHead>Date d'émission</TableHead>
                                            <TableHead className="text-right">Certificat</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {certs.map((cert) => (
                                            <TableRow key={cert.id} className="hover:bg-slate-50/50">
                                                <TableCell>
                                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                                        <Award className="w-4 h-4 text-emerald-500" />
                                                        {cert.user_name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 ml-6">{cert.user_email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="outline" className="w-fit text-[10px] uppercase">{cert.pack_type}</Badge>
                                                        <span className="text-xs text-slate-600 capitalize font-medium">{cert.specialty !== 'none' ? cert.specialty : 'Généraliste'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-700">{cert.course_title}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                                                        {cert.final_grade.toFixed(1)}/20
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {formatDate(cert.issued_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="bg-slate-900 text-white hover:bg-slate-800"
                                                        onClick={() => handleDownload(cert.storage_path, cert.id)}
                                                        disabled={downloadingId === cert.id}
                                                    >
                                                        {downloadingId === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                                        PDF
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {certs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                                    Aucun certificat délivré pour le moment.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="eligible">
                    <Card className="border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Félicitations en Attente</CardTitle>
                                <CardDescription>Étudiants ayant complété 100% de leur cursus sans avoir téléchargé leur diplôme.</CardDescription>
                            </div>
                            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-amber-100">
                                <Info className="w-4 h-4" />
                                Action requise par l'élève
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Étudiant</TableHead>
                                        <TableHead>Spécialité</TableHead>
                                        <TableHead>Cursus Terminés</TableHead>
                                        <TableHead>Statut Académique</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eligible.map((std, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <div className="font-bold text-slate-900">{std.user_name}</div>
                                                <div className="text-xs text-slate-500">{std.user_email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">{std.specialty}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 italic">
                                                {std.course_title}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                                    <Award className="w-4 h-4" /> 100% COMPLÉTÉ
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline" className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => toast.success("Rappel envoyé (Simulation)")}>
                                                    Envoyer Rappel
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {eligible.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                                                Aucun étudiant éligible en attente.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

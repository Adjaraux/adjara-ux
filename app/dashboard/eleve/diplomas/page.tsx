'use client';

import { useState } from 'react';
import { useAcademyLogic } from '@/hooks/use-academy-logic';
import { generateCertificate } from '@/app/actions/certificates';
import { Loader2, Lock, Download, Trophy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
// Note: We do NOT import @react-pdf/renderer here to avoid Server-Side Rendering (SSR) issues (Error #31).
// We import it dynamically inside handleDownload.

export default function DiplomasPage() {
    const { profile, specialtyCourses, isSpecialtyComplete, loading } = useAcademyLogic();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!isSpecialtyComplete || !specialtyCourses.length) return;

        setIsGenerating(true);
        try {
            // We use the LAST course of the specialty as the reference for the Diploma
            // This assumes the curriculum is linear and the last course represents completion.
            const lastCourse = specialtyCourses[specialtyCourses.length - 1];

            if (!lastCourse) {
                toast.error("Erreur: Aucun cours trouvé pour cette spécialité.");
                return;
            }

            toast.info("Validation du diplôme en cours...", { duration: 2000 });

            // 1. RECORD COMPLETION ON SERVER (DB Insert Logic Only - No PDF generation on server)
            // This server action returns pure JSON data, no React components.
            const result = await generateCertificate(lastCourse.id, lastCourse.slug);

            if (!result || !result.success || !result.data) {
                throw new Error("Impossible de valider le certificat côté serveur.");
            }

            toast.info("Génération du PDF dans le navigateur...", { duration: 2000 });

            // 2. DYNAMIC IMPORT (Client-Side Only)
            // This ensures potential Node.js/React conflicts are avoided because this code ONLY runs in the browser.
            const { pdf } = await import('@react-pdf/renderer');
            // We also import the template dynamically to be safe
            const { CertificateTemplate } = await import('@/components/certificates/CertificateTemplate');

            // 3. GENERATE PDF BLOB
            const blob = await pdf(<CertificateTemplate data={result.data} settings={result.settings} />).toBlob();

            // 4. TRIGGER DOWNLOAD
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Certificat_${result.data.courseName.replace(/\s+/g, '_')}_${result.data.studentName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Certificat téléchargé avec succès !");

        } catch (error: any) {
            console.error("Certificate Error:", error);
            toast.error(error.message || "Une erreur est survenue lors de la génération.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!profile) return null;

    if (profile.specialty === 'none' || !profile.specialty) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-slate-500" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Aucune Spécialité Sélectionnée</h1>
                <p className="text-slate-500 mb-6">Vous devez d'abord compléter le Tronc Commun et choisir une spécialité pour prétendre au diplôme.</p>
            </div>
        );
    }

    const specialtyName = profile.specialty.charAt(0).toUpperCase() + profile.specialty.slice(1);

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Mes Diplômes 🎓</h1>
                <p className="text-slate-500 mt-2">Certifications officielles de l'Académie.</p>
            </div>

            <Card className={`border-2 ${isSpecialtyComplete ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${isSpecialtyComplete ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-slate-900">Diplôme Expert {specialtyName}</CardTitle>
                                <CardDescription className="mt-1">
                                    Certification de fin de cursus - Spécialisation {specialtyName}
                                </CardDescription>
                            </div>
                        </div>
                        {isSpecialtyComplete ? (
                            <Badge className="bg-green-600 text-white hover:bg-green-700">Validé ✔️</Badge>
                        ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-300 bg-white">Verrouillé 🔒</Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    {!isSpecialtyComplete ? (
                        <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-start gap-3">
                            <Lock className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="font-semibold mb-1">Diplôme verrouillé</p>
                                <p>Pour obtenir ce certificat, vous devez compléter l'intégralité des modules de votre spécialité à 100%.</p>
                                {specialtyCourses.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-400">
                                        Progression : {specialtyCourses.filter(c => (c.progressPercent || 0) === 100).length} / {specialtyCourses.length} modules validés.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-green-800 text-sm bg-green-50 p-4 rounded-lg border border-green-200">
                            Félicitations ! Vous avez validé tous les acquis nécessaires. Votre certificat est prêt.
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-end pt-4">
                    <Button
                        onClick={handleDownload}
                        disabled={!isSpecialtyComplete || isGenerating}
                        className={isSpecialtyComplete ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-slate-300 text-slate-500 cursor-not-allowed"}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger mon Certificat
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

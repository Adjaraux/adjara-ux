'use client';
// Updated: Secure View v2

import { SpecsViewer } from '@/components/admin/specs-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Clock, DollarSign, Download, Lock, CheckCircle, Briefcase, FileText } from 'lucide-react';
import { getSignedUrlAction } from '@/app/actions/storage';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SubmitWorkModal } from '@/components/agency/submit-work-modal';

interface MissionViewProps {
    mission: any; // Type from DTO
}

export function MissionViewClient({ mission }: MissionViewProps) {
    const router = useRouter();
    const isAssigned = mission.status === 'in_progress';
    const isOpen = mission.status === 'open';

    const deadlineDate = mission.deadline ? new Date(mission.deadline) : null;
    const timeLeft = deadlineDate && isAssigned
        ? formatDistanceToNow(deadlineDate, { locale: fr, addSuffix: true })
        : null;

    const handleDownload = async (fileUrl: string, fileName: string) => {
        toast.loading(`Téléchargement de ${fileName}...`);
        const res = await getSignedUrlAction(fileUrl, mission.id);
        toast.dismiss();

        if (res.success && res.signedUrl) {
            window.open(res.signedUrl, '_blank');
        } else {
            toast.error("Impossible de télécharger le fichier : " + res.message);
        }
    };

    const handleApply = () => {
        toast.info("Fonctionnalité 'Postuler' à venir dans le Sprint suivant ! 🚀");
    };

    const handleSubmit = () => {
        toast.info("Fonctionnalité 'Soumettre' à venir ! 📤");
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Navigation */}
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 pl-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux missions
            </Button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-widest text-[10px]">
                            {mission.client_industry || "Secteur Activité"}
                        </Badge>
                        {isAssigned && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                                <Clock className="w-3 h-3 mr-1" /> En Cours
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{mission.title}</h1>
                    <p className="text-slate-500 mt-2 max-w-2xl text-lg leading-relaxed">
                        {mission.description}
                    </p>
                </div>

                {/* Side Stats */}
                <Card className="bg-slate-50 border-slate-200 min-w-[250px]">
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Budget Estimé</span>
                            <div className="flex items-center gap-1 text-2xl font-bold text-slate-900">
                                {mission.final_price ? mission.final_price.toLocaleString() : mission.budget_range}
                                <span className="text-sm font-medium text-slate-500 ml-1">FCFA</span>
                            </div>
                        </div>

                        {isAssigned && deadlineDate && (
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Délai Restant</span>
                                <div className="text-lg font-bold text-amber-600 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    {timeLeft}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Deadline : {deadlineDate.toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        <Separator className="bg-slate-200" />



                        {isAssigned && (
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12" onClick={handleSubmit}>
                                Soumettre mon Travail 📤
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Airlock Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Lock className="h-5 w-5 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Mode Agence Privée</h3>
                        <div className="mt-2 text-sm text-amber-700">
                            <p>
                                Votre espace de travail sécurisé.
                                Tous les échanges et livrables sont centralisés ici pour garantir le suivi pédagogique.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Specs */}
                <div className="lg:col-span-2 space-y-6">
                    <SpecsViewer specs={mission.specs} className="shadow-md border-slate-200" />
                </div>

                {/* Attachments & Resources */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Download className="w-4 h-4" /> Fichiers Sources
                            </h3>
                            {mission.attachments && mission.attachments.length > 0 ? (
                                <div className="space-y-2">
                                    {mission.attachments.map((file: any, i: number) => (
                                        <div key={i} onClick={() => handleDownload(file.url, file.name)}
                                            className="flex items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors group cursor-pointer">
                                            <div className="bg-white p-2 rounded-md shadow-sm group-hover:shadow text-slate-400">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="ml-3 overflow-hidden">
                                                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                                <p className="text-xs text-slate-400 uppercase">{file.type || 'Fichier'}</p>
                                            </div>
                                            <Download className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-500" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">Aucune pièce jointe.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Modal Trigger (If Asssigned) */}
                    {isAssigned && (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center space-y-3">
                            <h3 className="font-bold text-indigo-900">Espace Livraison</h3>
                            <p className="text-xs text-indigo-700">
                                Une fois le design terminé, uploadez vos fichiers ici pour validation.
                            </p>
                            <SubmitWorkModal
                                missionId={mission.id}
                                missionTitle={mission.title}
                                trigger={
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12">
                                        Soumettre mon Travail 📤
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

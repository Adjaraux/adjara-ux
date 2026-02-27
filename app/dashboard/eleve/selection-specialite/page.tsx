'use client';

import { useAcademyLogic } from '@/hooks/use-academy-logic';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, Crown, Palette, Search, Rocket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateStudentSpecialtyAction } from '@/app/actions/academy';

export default function SelectionSpecialitePage() {
    const { profile, loading, needsSpecialtySelection } = useAcademyLogic();
    const router = useRouter();
    const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Redirect if they shouldn't be here
    useEffect(() => {
        if (!loading && profile) {
            // 1. If they don't have a pack => Pricing
            if (!profile.pack_type) {
                router.push('/pricing?reason=finished_basics');
            }
            // 2. If they ALREADY have a specialty selected and TC is complete => Back to learning
            else if (profile.specialty && profile.specialty !== 'none' && !needsSpecialtySelection) {
                router.push('/dashboard/eleve/learning');
            }
        }
    }, [loading, profile, needsSpecialtySelection, router]);

    const specialties = [
        {
            id: 'textile',
            title: 'Spécialité Textile 👕',
            desc: 'Maîtrisez la personnalisation textile de A à Z.',
            points: ['Flocage à presse à chaud', 'Sérigraphie (Peinture)', 'Découpe vinyle'],
            icon: Palette,
            color: 'bg-pink-50 text-pink-700 border-pink-200'
        },
        {
            id: 'digital', // Mapped to Design & Dev
            title: 'Spécialité Design & Dev 💻',
            desc: 'Devenez un créateur numérique complet.',
            points: ['UX/UI (Figma/Adobe XD)', 'Python & VibeCode', 'DevOps & No-Code'],
            icon: Rocket,
            color: 'bg-purple-50 text-purple-700 border-purple-200'
        },
        {
            id: 'gravure',
            title: 'Spécialité Gravure 🔨',
            desc: "L'art de la découpe et de la signalétique.",
            points: ['Enseignes lumineuses', 'Découpe Laser/CNC', 'Maîtrise LightBurn'],
            icon: Search, // Maybe switch imports to Hammer if available, or Scissors? Keeping Search for now effectively resets generic icon
            color: 'bg-blue-50 text-blue-700 border-blue-200'
        }
    ];

    if (loading || !profile?.pack_type) return <div>Chargement...</div>;

    const packName = profile.pack_type ? profile.pack_type.charAt(0).toUpperCase() + profile.pack_type.slice(1) : '';
    const duration = profile.pack_type === 'essentiel' ? '6 mois' : (profile.pack_type === 'expert' ? '24 mois' : 'illimitée');

    const isMaster = profile.pack_type === 'master';
    const headerTitle = isMaster
        ? "Votre Pack Master vous donne un accès total. Par quelle spécialité souhaitez-vous commencer ?"
        : `Votre Tronc Commun est validé. Votre Pack ${packName} vous donne accès à une voie d'excellence. Choisissez celle qui vous correspond.`;

    const handleConfirm = async () => {
        if (!selectedSpec || !profile) return;
        setIsSubmitting(true);

        try {
            const result = await updateStudentSpecialtyAction(selectedSpec);

            if (!result.success) throw new Error(result.error);

            // Success!
            router.refresh(); // Fresh data for Layout
            router.push('/dashboard/eleve/learning?welcome_specialty=true');
        } catch (err: any) {
            console.error("Error saving specialty:", err);
            alert("Une erreur est survenue lors de l'enregistrement choix. Veuillez réessayer.");
            setIsSubmitting(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">Quelle direction pour votre carrière ?</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    {isMaster ? (
                        <span>Votre <span className="font-bold text-purple-600">Pack Master</span> vous donne un accès total. Par quelle spécialité souhaitez-vous commencer ?</span>
                    ) : (
                        <span>Votre Tronc Commun est validé. Votre <span className="font-bold text-indigo-600">Pack {packName}</span> vous donne accès à <span className="font-bold text-indigo-600">une voie d'excellence</span>. Choisissez celle qui vous correspond.</span>
                    )}
                </p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                {specialties.map((spec) => {
                    const isSelected = selectedSpec === spec.id;
                    const Icon = spec.icon;
                    return (
                        <div
                            key={spec.id}
                            onClick={() => setSelectedSpec(spec.id)}
                            className={`cursor-pointer transition-all duration-300 relative group
                                ${isSelected ? 'ring-4 ring-indigo-600 shadow-2xl scale-105 z-10' : 'hover:scale-105 hover:shadow-xl opacity-90 hover:opacity-100'}
                            `}
                        >
                            <Card className={`h-full border-2 ${isSelected ? 'border-indigo-600' : 'border-slate-100'}`}>
                                <CardHeader className={`${spec.color} rounded-t-lg bg-opacity-50`}>
                                    <Icon className="w-12 h-12 mb-4" />
                                    <CardTitle className="text-xl">{spec.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-slate-600 mb-4">{spec.desc}</p>
                                    <ul className="space-y-2">
                                        {spec.points.map((point, i) => (
                                            <li key={i} className="flex items-center text-sm text-slate-500">
                                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <div className={`w-full py-2 rounded-lg text-center font-bold border-2 
                                        ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-400'}
                                    `}>
                                        {isSelected ? 'Sélectionné' : 'Choisir cette voie'}
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    )
                })}
            </div>

            <div className="mt-12 flex justify-center">
                <Button
                    size="lg"
                    className="text-lg px-8 py-6 font-bold bg-slate-900 hover:bg-slate-800"
                    disabled={!selectedSpec || isSubmitting}
                    onClick={() => setShowConfirm(true)}
                >
                    {isSubmitting ? 'Validation...' : 'Je confirme mon choix 🔒'}
                </Button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && selectedSpec && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-slate-900">Choix Définitif ?</h3>
                            <p className="text-slate-600 mt-2">
                                Vous êtes sur le point de débloquer une durée <span className="font-bold">{duration}</span> de contenu {specialties.find(s => s.id === selectedSpec)?.title}.
                                <br /><br />
                                <span className="bg-red-50 text-red-600 px-2 py-1 rounded font-bold text-sm">Action Irréversible</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Annuler</Button>
                            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleConfirm} disabled={isSubmitting}>
                                Je valide mon avenir 🚀
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

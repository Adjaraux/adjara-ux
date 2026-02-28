'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, CreditCard } from 'lucide-react';
import { getPaymentConfig } from '@/app/actions/payments';
import { useRouter } from 'next/navigation';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { PaymentMethodSelector } from '@/components/client/payment-method-selector';

// Remove old CinetPay Global
// declare global {
//     interface Window {
//         CinetPay: any;
//     }
// }

interface PricingCardsProps {
    user?: any;
    initialPackId?: string;
}

const tiers = [
    {
        name: 'Pack Essentiel',
        id: 'essentiel',
        price: 120000,
        currency: 'XOF',
        description: 'Pour démarrer et maîtriser une compétence clé.',
        features: [
            'Total 9 Mois de Formation',
            '3 Mois Tronc Commun',
            '6 Mois de Spécialité (au choix)',
            'Support par email',
            'Accès Communauté'
        ],
        color: 'bg-brand-orange',
        cta: 'Démarrer'
    },
    {
        name: 'Pack Expert',
        id: 'expert',
        price: 230000,
        currency: 'XOF',
        description: 'Pour devenir un professionnel aguerri.',
        features: [
            'Total 27 Mois de Formation',
            '3 Mois Tronc Commun',
            '24 Mois de Spécialité (au choix)',
            'Projets réels corrigés',
            'Mentoring de groupe',
            'Portfolio Review'
        ],
        color: 'bg-brand-orange',
        cta: 'Devenir Expert'
    },
    {
        name: 'Pack Master',
        id: 'master',
        price: 350000,
        currency: 'XOF',
        description: 'L\'expérience complète et illimitée.',
        features: [
            'Total 36 Mois de Formation',
            'Accès toutes spécialités (Déblocage progressif)',
            'Accès LAB & Leadership',
            'Coaching Individuel',
            'Opportunités Agence'
        ],
        color: 'bg-brand-orange',
        cta: 'Viser l\'Excellence'
    }
];

export function PricingCards({ user, initialPackId }: PricingCardsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<any | null>(null);
    const router = useRouter();

    // Auto-select pack if provided in URL (and user is logged in)
    useState(() => {
        if (initialPackId && user) {
            const pack = tiers.find(t => t.id === initialPackId);
            if (pack) {
                // Use a small timeout to ensure the component is fully mounted
                setTimeout(() => setSelectedPack(pack), 500);
            }
        }
    });

    const handlePurchase = (tier: any) => {
        if (!user) {
            router.push(`/auth?returnTo=/pricing?pack=${tier.id}`);
            return;
        }
        setSelectedPack(tier);
    };

    return (
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {tiers.map((tier) => (
                <Card key={tier.id} className={`flex flex-col relative overflow-hidden transition-all hover:shadow-2xl bg-white/5 border-white/10 backdrop-blur-sm ${tier.id === 'expert' ? 'border-brand-orange/50 border-2 shadow-brand-orange/5' : ''}`}>
                    {tier.id === 'expert' && (
                        <div className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-black px-3 py-1 rounded-bl uppercase tracking-widest shadow-laser-sm">
                            RECOMMANDÉ
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-white">{tier.name}</CardTitle>
                        <CardDescription className="text-slate-400">{tier.description}</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold tracking-tight text-white">{tier.price.toLocaleString('fr-FR')}</span>
                            <span className="ml-1 text-sm font-semibold text-slate-500">{tier.currency}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3">
                            {tier.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                                    <Check className="w-4 h-4 text-brand-orange mt-0.5 shrink-0 shadow-laser-sm" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            className={`w-full font-bold ${tier.color} hover:opacity-90 text-white shadow-lg shadow-brand-orange/20`}
                            size="lg"
                            onClick={() => handlePurchase(tier)}
                            disabled={!!loading}
                        >
                            <CreditCard className="w-5 h-5 mr-2" />
                            {tier.cta}
                        </Button>
                    </CardFooter>
                </Card>
            ))}

            <Dialog open={!!selectedPack} onOpenChange={(open) => !open && setSelectedPack(null)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent">
                    {selectedPack && (
                        <PaymentMethodSelector
                            packType={selectedPack.id}
                            amount={selectedPack.price}
                            currency={selectedPack.currency}
                            projectTitle={selectedPack.name}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <div className="col-span-1 md:col-span-3 mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-center backdrop-blur-sm">
                <p className="text-slate-300 font-medium">
                    🛡️ <span className="font-bold text-brand-orange">Pas de panique :</span> Même avec le pack complet, la formation est organisée <span className="underline decoration-brand-orange/50">étape par étape</span> pour éviter toute confusion.
                </p>
            </div>
        </div>
    );
}

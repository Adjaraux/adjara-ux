'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Smartphone, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { simulateMonerooPayment, initializeMonerooPayment } from '@/app/actions/moneroo';

interface PaymentSelectorProps {
    projectId?: string;
    packType?: 'essentiel' | 'expert' | 'master';
    amount: number; // in simple units (e.g. 500000 FCFA)
    currency: string;
    projectTitle?: string; // or pack name
}

export function PaymentMethodSelector({ projectId, packType, amount, currency, projectTitle }: PaymentSelectorProps) {
    const [loading, setLoading] = useState(false);
    const isDev = process.env.NODE_ENV === 'development';

    const handleMonerooPayment = async () => {
        setLoading(true);
        toast.loading("Initialisation du paiement sécurisé...");

        try {
            const res = await initializeMonerooPayment({
                projectId,
                packType,
                amount
            });

            if (res.success && res.checkout_url) {
                toast.success("Redirection vers Moneroo...");
                window.location.href = res.checkout_url;
            } else {
                toast.error(res.error || "Erreur lors de l'initialisation.");
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur de connexion paiement.");
            setLoading(false);
        }
    };

    const handleSimulation = async () => {
        setLoading(true);
        toast.loading("SIMULATION: Paiement Moneroo en cours...");

        try {
            const res = await simulateMonerooPayment({
                projectId,
                packType,
                amount
            });

            if (res.success) {
                toast.success("SIMULATION: Paiement Validé ! 🎉");
                // Trigger confetti or refresh
                setTimeout(() => {
                    const params = new URLSearchParams(window.location.search);
                    params.set('status', 'payment_callback');
                    window.location.search = params.toString();
                }, 1000);
            } else {
                toast.error(`SIMULATION ERROR: ${res.error}`);
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur Simulation");
            setLoading(false);
        }
    };

    return (
        <Card className="border-indigo-100 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white border-b border-indigo-100 pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-300" />
                    Paiement Sécurisé
                </CardTitle>
                <CardDescription className="text-indigo-200">
                    Réglez <strong>"{projectTitle || (packType ? 'Pack ' + packType.toUpperCase() : 'votre commande')}"</strong> via Mobile Money.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* Amount Display */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Total à régler</span>
                    <span className="text-3xl font-bold text-slate-900">
                        {(() => {
                            const safeCurrency = currency === 'FCFA' ? 'XOF' : (currency || 'XOF');
                            return new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: safeCurrency
                            }).format(amount);
                        })()}
                    </span>
                </div>

                {/* Moneroo Option (The Only Option) */}
                <div className="relative flex flex-col p-5 border-2 border-indigo-600 bg-indigo-50/20 rounded-xl">
                    <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            Recommandé 🇹🇬
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-indigo-600 p-3 rounded-full text-white">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Mobile Money</h3>
                            <p className="text-sm text-slate-500">via Moneroo</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        {/* Mixx by Yas (TMoney) */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-xs text-black">M</div>
                            <span className="text-sm font-semibold text-slate-700">Mixx by Yas</span>
                        </div>
                        {/* Moov Money */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">M</div>
                            <span className="text-sm font-semibold text-slate-700">Moov Money</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleMonerooPayment}
                        disabled={loading} // Only disabled if real payment loading
                        className="w-full h-12 mt-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100"
                    >
                        Payer avec Moneroo
                    </Button>

                    <p className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Transaction chiffrée SSL.
                    </p>
                </div>

                {/* DEV SIMULATION (Subtle) */}
                {isDev && (
                    <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center">
                        <Button
                            onClick={handleSimulation}
                            disabled={loading}
                            variant="ghost"
                            size="sm"
                            className="text-[10px] text-slate-400 hover:text-amber-600 hover:bg-amber-50 uppercase tracking-widest font-bold"
                        >
                            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                            Simuler Success (Dev)
                        </Button>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}

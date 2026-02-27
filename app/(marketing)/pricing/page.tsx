import { PricingCards } from '@/components/marketing/pricing-cards';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Script from 'next/script';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
    const { reason } = await searchParams;
    const cookieStore = await cookies();

    // Fetch User for Pre-filling CinetPay
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );
    const { data: { user } } = await supabase.auth.getUser();

    let message = "Choisissez le plan qui correspond à votre ambition.";
    if (reason === 'expired') message = "Votre période d'essai est terminée. Choisissez un pack pour continuer.";
    if (reason === 'locked_pack') message = "Ce contenu est réservé aux membres Expert ou Master.";
    if (reason === 'finished_basics') message = "Félicitations pour avoir terminé les bases ! Pour continuer vers une spécialité (Textile, Design ou Gravure), choisissez le pack qui vous convient.";

    return (
        <div className="min-h-screen bg-[#05080f] text-white py-24">
            <Script src="https://cdn.cinetpay.com/seamless/main.js" strategy="lazyOnload" />

            <div className="max-w-6xl mx-auto px-6">
                <Link href="/dashboard/eleve">
                    <Button variant="ghost" className="mb-12 text-slate-400 hover:text-brand-orange hover:bg-white/5 font-medium transition-all group rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Retour au Dashboard
                    </Button>
                </Link>

                <div className="text-center mb-20 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-[10px] font-bold uppercase tracking-widest mb-6">
                        Investissement & Excellence
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight text-white">
                        Propulsez votre <br /><span className="text-brand-orange">Ambition Technologique.</span>
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto leading-relaxed ${reason ? 'text-red-400 font-bold' : 'text-slate-400 font-medium'}`}>
                        {message}
                    </p>
                </div>

                <div className="relative z-10">
                    <PricingCards user={user} />
                </div>

                <div className="mt-20 pt-12 border-t border-white/10 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest space-y-2">
                    <p>Paiement sécurisé via CinetPay (T-Money, Flooz, Carte Bancaire).</p>
                    <p>Accès immédiat après validation cryptographique.</p>
                </div>
            </div>
        </div>
    );
}

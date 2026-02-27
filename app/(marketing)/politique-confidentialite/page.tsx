'use client';

import { motion } from 'framer-motion';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-6">
                        Politique de Confidentialité
                    </h1>

                    <div className="space-y-8 text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Collecte des données</h2>
                            <p>Nous collectons vos informations lors de votre inscription (nom, email) et de vos paiements.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Utilisation des données</h2>
                            <p>Vos données servent uniquement à la gestion de votre compte, au suivi de votre progression LMS et au traitement de vos commandes.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Sécurité</h2>
                            <p>Nous utilisons des protocoles sécurisés (HTTPS) et les services de Supabase et Moneroo pour garantir la protection de vos données.</p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100 text-sm text-slate-400">
                        Dernière mise à jour : 22 février 2026
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';

export default function CGVPage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-6">
                        Conditions Générales de Vente (CGV)
                    </h1>

                    <div className="space-y-8 text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Objet</h2>
                            <p>Les présentes CGV régissent la vente des programmes de formation en design UX/UI et des prestations de services numériques proposées par Adjara UX.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Services et Formations</h2>
                            <p>Adjara UX propose :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Des formations en ligne via son espace Académie.</li>
                                <li>Des services de design UX/UI pour les entreprises.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Tarifs et Paiement</h2>
                            <p>Les prix sont indiqués en Francs CFA (XOF). Le paiement s'effectue via la plateforme sécurisée Moneroo par Mobile Money ou carte bancaire.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Accès aux services</h2>
                            <p>L'accès aux formations est débloqué immédiatement après la confirmation du paiement par le système Moneroo.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Remboursement</h2>
                            <p>Compte tenu de la nature numérique des contenus, aucun remboursement n'est possible une fois que l'accès à la formation a été consommé.</p>
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

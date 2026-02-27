'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, BookOpen, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogoBrand } from '@/components/brand/logo-brand';

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-100 text-center border border-indigo-50"
            >
                <div className="mb-8 flex justify-center">
                    <LogoBrand />
                </div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600"
                >
                    <CheckCircle2 className="w-12 h-12" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-slate-900 mb-4"
                >
                    Paiement Réussi ! 🎉
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-500 mb-10 leading-relaxed"
                >
                    Votre transaction a été validée avec succès. Notre système active actuellement vos accès.
                    Vous recevrez votre facture par email dans quelques instants.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-4"
                >
                    <Link href="/dashboard/eleve/learning" className="block w-full">
                        <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-2xl shadow-lg shadow-indigo-100 group">
                            Accéder à l'Académie
                            <BookOpen className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>

                    <Link href="/dashboard/client/projects" className="block w-full">
                        <Button variant="outline" className="w-full h-14 text-slate-600 border-slate-200 hover:bg-slate-50 text-lg font-semibold rounded-2xl group">
                            Suivre mon Projet
                            <LayoutDashboard className="ml-2 w-5 h-5 opacity-50" />
                        </Button>
                    </Link>
                </motion.div>

                <p className="mt-8 text-xs text-slate-400 font-medium italic">
                    Un problème ? Contactez notre support à contactadjara@gmail.com
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-12 text-slate-400 text-sm flex items-center gap-2"
            >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Validation Webhook en cours...
            </motion.div>
        </div>
    );
}

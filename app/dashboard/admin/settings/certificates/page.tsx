'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function CertificateSettingsPage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Design du Certificat 🎨</h1>
                    <p className="text-slate-500 mt-2">Personnalisez l'apparence des diplômes délivrés aux élèves.</p>
                </div>
            </div>

            <Card className="border-dashed border-2 border-slate-300 bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Wrench className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700">Fonctionnalité en Maintenance</h2>
                    <p className="text-slate-500 max-w-md mt-2">
                        Le module de personnalisation avancée des certificats est temporairement désactivé pour optimisation.
                        <br /><br />
                        Les certificats des élèves continuent de fonctionner avec le design par défaut.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

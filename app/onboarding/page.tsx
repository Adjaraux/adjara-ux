import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Briefcase } from 'lucide-react';

export default function OnboardingPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-4 bg-slate-50 flex items-center justify-center">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Bienvenue sur Adjara UX</h1>
                    <p className="text-xl text-slate-600">Quel est votre objectif aujourd'hui ?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card Élève */}
                    <Card className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-slate-200">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <GraduationCap className="text-indigo-600 w-8 h-8" />
                            </div>
                            <CardTitle className="text-2xl">Rejoindre l'Académie</CardTitle>
                            <CardDescription>Je veux me former et développer mes compétences</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 mb-8 text-slate-600 text-sm">
                                <li>• Formations certifiantes</li>
                                <li>• Suivi mentoré</li>
                                <li>• Communauté d'experts</li>
                            </ul>
                            <Link href="/contact?type=formation">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Devenir Élève</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Card Client */}
                    <Card className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-slate-200">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="text-amber-600 w-8 h-8" />
                            </div>
                            <CardTitle className="text-2xl">Lancer un Projet</CardTitle>
                            <CardDescription>J'ai un besoin technique ou créatif pour mon entreprise</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 mb-8 text-slate-600 text-sm">
                                <li>• Prestations sur mesure</li>
                                <li>• Devis sous 24h</li>
                                <li>• Qualité professionnelle</li>
                            </ul>
                            <Link href="/contact?type=prestation">
                                <Button className="w-full bg-amber-600 hover:bg-amber-700">Demander un Devis</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}

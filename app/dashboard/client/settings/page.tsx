'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Lock, CreditCard, Loader2, ShieldCheck, Eye, EyeOff, FileText as FileTextIcon } from 'lucide-react';

export default function ClientSettingsPage() {
    const [loading, setLoading] = useState(false);

    // Password State
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Visibility Toggles
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleUpdatePassword = async () => {
        if (!oldPassword || !password || !confirmPassword) {
            toast.error("Veuillez remplir tous les champs.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setLoading(true);

        // 1. Verify Old Password
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            toast.error("Session invalide.");
            setLoading(false);
            return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: oldPassword
        });

        if (signInError) {
            toast.error("L'ancien mot de passe est incorrect.");
            setLoading(false);
            return;
        }

        // 2. Update Password
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            toast.error("Erreur mise à jour : " + error.message);
        } else {
            toast.success("Mot de passe mis à jour avec succès !");
            setOldPassword('');
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Paramètres du Compte</h1>
                <p className="text-slate-500">Gérez vos informations de sécurité et de facturation.</p>
            </div>

            <Tabs defaultValue="security" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Sécurité
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Facturation
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: SECURITY */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                Changer de mot de passe
                            </CardTitle>
                            <CardDescription>
                                Pour votre sécurité, veuillez confirmer votre ancien mot de passe.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-md">

                            {/* Old Password */}
                            <div className="space-y-2">
                                <Label htmlFor="old-password">Ancien mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="old-password"
                                        type={showOldPassword ? "text" : "password"}
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* New Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirmer</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleUpdatePassword}
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 w-full mt-2"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Mettre à jour
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: BILLING */}
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique de Facturation</CardTitle>
                            <CardDescription>
                                Retrouvez ici toutes vos factures pour vos projets réalisés avec l'Agence.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h3 className="text-slate-900 font-medium mb-1">Aucune facture disponible</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                    Vos factures apparaîtront ici une fois que vous aurez validé et payé vos premières commandes.
                                </p>
                            </div>

                            {/* MOCKUP FOR FUTURE DEVS */}
                            {/* 
                            <div className="mt-8">
                                <h4 className="text-sm font-bold text-slate-900 mb-4">Dernières transactions</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-green-100 p-2 rounded text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">Création Site Vitrine</p>
                                                <p className="text-xs text-slate-500">12 Fév 2026</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">150,000 FCFA</p>
                                            <Button variant="ghost" size="sm" className="h-6 mt-1 text-indigo-600">
                                                <Download className="w-3 h-3 mr-1" /> PDF
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Helper Icon
function FileText({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
    )
}

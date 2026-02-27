'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit faire au moins 6 caractères.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard/eleve');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-lg bg-white">
                <CardHeader className="space-y-2 pt-8 pb-4 px-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                        <span className="text-white font-bold text-2xl">A</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                        Nouveau mot de passe
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-sm">
                        Définissez votre nouveau mot de passe pour sécuriser votre compte.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 pb-8 px-8">
                    {success ? (
                        <div className="text-center space-y-6 py-4">
                            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-emerald-700 font-bold text-lg">Mot de passe mis à jour !</p>
                                <p className="text-slate-500 text-sm">Réinitialisation réussie. Redirection vers votre tableau de bord...</p>
                            </div>
                            <Button
                                onClick={() => router.push('/dashboard/eleve')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Accéder au Dashboard
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password-new" className="text-slate-700 font-semibold text-sm">
                                    Nouveau mot de passe <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="password-new"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-[48px]"
                                    placeholder="Saisissez 6 caractères min."
                                    minLength={6}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password-confirm" className="text-slate-700 font-semibold text-sm">
                                    Confirmez le mot de passe <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="password-confirm"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-[48px]"
                                    placeholder="Répétez le mot de passe"
                                    minLength={6}
                                />
                            </div>

                            {error && (
                                <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-[48px] text-[16px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                        Mise à jour...
                                    </>
                                ) : (
                                    'Mettre à jour le mot de passe'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.push('/auth')}
                                className="w-full text-slate-500 text-sm"
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}

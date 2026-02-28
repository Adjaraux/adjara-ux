'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowLeft, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AuthStep = 'EMAIL' | 'LOADING' | 'PASSWORD' | 'GOOGLE' | 'REGISTER' | 'CHECK_EMAIL' | 'FORGOT_PASSWORD' | 'CHECK_EMAIL_RESET';

export default function AuthForm() {
    const router = useRouter();
    const [step, setStep] = useState<AuthStep>('EMAIL');
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Get returnTo from URL
    const [returnTo, setReturnTo] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const r = params.get('returnTo');
        if (r) setReturnTo(r);
    }, []);

    const performRedirect = () => {
        if (returnTo) {
            router.push(returnTo);
        } else {
            router.push('/welcome');
        }
    };

    // Identity Check Logic
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { data, error: rpcError } = await supabase.rpc('check_email_status', {
                email_input: email.trim(),
            });

            if (rpcError) throw rpcError;

            if (data.exists) {
                if (data.has_google) {
                    setStep('GOOGLE');
                } else {
                    setStep('PASSWORD');
                }
            } else {
                setStep('REGISTER');
            }
        } catch (err: any) {
            console.error('Check Error:', err);
            // Fallback to REGISTER if check fails
            setStep('REGISTER');
        } finally {
            setIsLoading(false);
        }
    };

    // Login (Password)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            performRedirect();
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials'
                ? 'Mot de passe incorrect.'
                : err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Register (New User)
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Safety Timeout
        const safetyTimeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
                setError("Le serveur met du temps à répondre. Vérifiez votre boîte mail ou réessayez.");
            }
        }, 10000);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                },
            });

            if (data.session) {
                performRedirect();
                return;
            }

            if (error) throw error;

            // No session means email confirmation is required
            setStep('CHECK_EMAIL');

        } catch (err: any) {
            const msg = err.message.toLowerCase();
            if (msg.includes("rate limit")) {
                setError("Sécurité : Trop de tentatives. Attendez 60s ou utilisez un autre email.");
            } else if (msg.includes("already registered") || msg.includes("unique constraint")) {
                setError("Ce compte existe déjà. Redirection connexion...");
                setTimeout(() => setStep('PASSWORD'), 2000);
            } else {
                setError(err.message);
            }
        } finally {
            clearTimeout(safetyTimeout);
            setIsLoading(false);
        }
    };

    // Watchdog
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                performRedirect();
            }
        });
        return () => subscription.unsubscribe();
    }, [router, returnTo]);

    // Google Login
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        } finally {
            // Keep loading roughly false if error, but OAuth redirects anyway
            setIsLoading(false);
        }
    };

    // Forgot Password Request
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error) throw error;
            setStep('CHECK_EMAIL_RESET');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetFlow = () => {
        setStep('EMAIL');
        setPassword('');
        setError(null);
    };

    const getTitle = () => {
        switch (step) {
            case 'CHECK_EMAIL':
            case 'CHECK_EMAIL_RESET': return 'Vérifiez votre e-mail';
            case 'REGISTER': return 'S\'inscrire';
            case 'FORGOT_PASSWORD': return 'Réinitialiser le mot de passe';
            case 'GOOGLE':
            case 'PASSWORD': return 'Bon retour';
            default: return 'Se connecter ou créer un compte';
        }
    };

    const renderHeader = () => (
        <CardHeader className="space-y-2 pt-8 pb-2">
            {step !== 'EMAIL' && (
                <div className="absolute top-4 left-4">
                    <Button variant="ghost" size="icon" onClick={resetFlow} className="hover:bg-slate-100 rounded-full h-8 w-8">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </Button>
                </div>
            )}

            {step === 'EMAIL' && (
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-white font-bold text-2xl">A</span>
                </div>
            )}

            <CardTitle className={`text-2xl font-bold text-slate-900 ${step === 'EMAIL' ? 'text-center' : 'text-left'}`}>
                {getTitle()}
            </CardTitle>

            {step === 'EMAIL' && (
                <CardDescription className="text-center text-slate-600 text-[15px]">
                    Profitez de votre temps libre pour apprendre auprès des meilleures universités et entreprises.
                </CardDescription>
            )}
        </CardHeader>
    );

    return (
        <Card className="w-full border-0 shadow-none">
            {renderHeader()}

            <CardContent className="space-y-6 pt-4 pb-8 px-8">

                {step === 'EMAIL' && (
                    <>
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Adresse e-mail <span className="text-red-500">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nom@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-[48px] text-base border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full h-[48px] text-[16px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Continuer'}
                            </Button>
                        </form>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                            <div className="relative flex justify-center text-xs text-slate-500 bg-white px-2">ou</div>
                        </div>

                        <div className="space-y-3">
                            <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-[48px] text-slate-700 border-slate-800 hover:bg-slate-50 font-semibold text-[16px] rounded-lg relative">
                                <svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335" /></svg>
                                Continuer avec Google
                            </Button>
                        </div>
                    </>
                )}

                {step === 'GOOGLE' && (
                    <div className="space-y-6">
                        <div className="flex gap-3 text-slate-700 text-sm">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p>Un utilisateur ayant cette adresse e-mail s'est précédemment connecté en utilisant Google</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-semibold text-sm">Adresse e-mail <span className="text-red-500">*</span></Label>
                            <Input value={email} disabled className="bg-slate-50 border-slate-200 text-slate-500" />
                        </div>

                        <Button onClick={handleGoogleLogin} className="w-full h-[48px] text-[16px] font-semibold bg-white border border-slate-800 text-slate-800 hover:bg-slate-50 rounded-lg relative">
                            <svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335" /></svg>
                            Continuer avec Google
                        </Button>
                    </div>
                )}

                {step === 'PASSWORD' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-semibold text-sm">Adresse e-mail <span className="text-red-500">*</span></Label>
                            <Input value={email} disabled className="bg-slate-50 border-slate-200 text-slate-500" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Mot de passe <span className="text-red-500">*</span></Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-[48px]"
                                placeholder="Saisissez votre mot de passe"
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full h-[48px] text-[16px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Se connecter'}
                        </Button>
                        <div className="text-center">
                            <Button
                                type="button"
                                variant="link"
                                onClick={() => setStep('FORGOT_PASSWORD')}
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                                Mot de passe oublié ?
                            </Button>
                        </div>
                    </form>
                )}

                {step === 'FORGOT_PASSWORD' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-semibold text-sm">Adresse e-mail <span className="text-red-500">*</span></Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-[48px]"
                                placeholder="nom@email.com"
                                autoFocus
                            />
                        </div>
                        <p className="text-sm text-slate-500">
                            Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                        </p>
                        <Button type="submit" className="w-full h-[48px] text-[16px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Envoyer le lien'}
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('PASSWORD')} className="w-full text-slate-500">
                            Retour à la connexion
                        </Button>
                    </form>
                )}

                {step === 'REGISTER' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-semibold text-sm">Adresse e-mail <span className="text-red-500">*</span></Label>
                            <Input value={email} disabled className="bg-slate-50 border-slate-200 text-slate-500" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="fullname" className="text-slate-700 font-semibold text-sm">Nom complet <span className="text-red-500">*</span></Label>
                            <Input
                                id="fullname"
                                placeholder="Saisissez votre nom et prénom"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="h-[48px]"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password-reg" className="text-slate-700 font-semibold text-sm">Mot de passe <span className="text-red-500">*</span></Label>
                            <Input
                                id="password-reg"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-[48px]"
                                placeholder="Créez un mot de passe"
                                minLength={6}
                            />
                            <p className="text-xs text-slate-500">Entre 8 et 72 caractères</p>
                        </div>

                        <Button type="submit" className="w-full h-[48px] text-[16px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Inscrivez-vous gratuitement'}
                        </Button>

                        <p className="text-xs text-slate-500 leading-relaxed text-center px-4">
                            J'accepte les <a href="#" className="underline">Conditions d'utilisation</a> et la <a href="#" className="underline">Politique de confidentialité</a> d'Adjara UX.
                        </p>
                    </form>
                )}

                {step === 'CHECK_EMAIL' && (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Info className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-600">
                                Un lien de confirmation a été envoyé à <strong>{email}</strong>.
                            </p>
                            <p className="text-sm text-slate-500">
                                Veuillez cliquer sur le lien pour activer votre compte et accéder à Adjara UX.
                            </p>
                        </div>
                        <Button variant="outline" onClick={resetFlow} className="w-full">
                            Retour à la connexion
                        </Button>
                    </div>
                )}

                {step === 'CHECK_EMAIL_RESET' && (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Info className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-600">
                                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                            </p>
                            <p className="text-sm text-slate-500">
                                Veuillez consulter votre boîte de réception (et vos spams) pour changer votre mot de passe.
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setStep('PASSWORD')} className="w-full">
                            Retour à la connexion
                        </Button>
                    </div>
                )}

                {error && (
                    <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

            </CardContent>
        </Card>
    );
}

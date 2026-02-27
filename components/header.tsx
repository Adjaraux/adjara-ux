'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import AuthModal from './auth-modal';
import { LogoBrand } from './brand/logo-brand';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const categories = [
        { href: '/realisations', label: 'Réalisations' },
        { href: '/academie', label: 'Académie' },
        { href: '/prestations', label: 'Prestations' },
        { href: '/a-propos', label: 'À propos' },
        { href: '/contact', label: 'Contact' },
    ];

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        setMounted(true);
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setIsAuthModalOpen(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    const HEADER_CLASSES = "fixed w-full z-50 bg-[#05080f]/80 backdrop-blur-md border-b border-white/10";
    const CONTAINER_CLASSES = "container mx-auto px-4 h-20 flex items-center justify-between";

    return (
        <header className={HEADER_CLASSES} suppressHydrationWarning>
            <div className={CONTAINER_CLASSES}>
                {/* Logo */}
                <Link href="/" className="group">
                    <LogoBrand />
                </Link>

                {/* Desktop Navigation - Rendered early for SSR stability */}
                <nav className="hidden md:flex items-center space-x-8">
                    {categories.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative py-2 text-sm font-medium transition-all duration-300 ${isActive ? 'text-brand-orange' : 'text-slate-400 hover:text-brand-orange'
                                    }`}
                            >
                                {link.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-orange rounded-full duration-300" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Content - Client Side Only for Auth/Mobile */}
                {mounted ? (
                    <>
                        {/* CTA / Auth */}
                        <div className="hidden md:flex items-center space-x-4">
                            {session ? (
                                <div className="flex items-center gap-4">
                                    <Link href="/dashboard/eleve">
                                        <Button variant="ghost" className="font-semibold text-slate-300 hover:text-brand-orange hover:bg-white/5">
                                            <User className="w-4 h-4 mr-2" />
                                            Mon Espace
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        onClick={handleSignOut}
                                        className="text-slate-500 hover:bg-white/5 hover:text-red-400"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="text-slate-400 hover:text-brand-orange font-medium"
                                    >
                                        Connexion
                                    </Button>
                                    <Button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-sm"
                                    >
                                        S'inscrire
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-white"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </>
                ) : (
                    /* Stable Auth Placeholder for SSR */
                    <div className="flex items-center space-x-4">
                        <div className="h-4 w-20 bg-white/5 rounded-full md:hidden" />
                        <div className="hidden md:block h-10 w-24 bg-white/5 rounded-xl border border-white/5" />
                        <div className="hidden md:block h-10 w-24 bg-white/10 rounded-xl" />
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
            {mounted && isMenuOpen && (
                <div className="md:hidden bg-[#05080f] border-t border-white/10">
                    <ul className="container mx-auto px-4 py-4 space-y-4">
                        {categories.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <li key={link.href} className="flex items-center gap-3">
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-laser-sm" />}
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block transition-colors font-medium py-2 ${isActive ? 'text-brand-orange' : 'text-slate-400 hover:text-brand-orange'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                        <li className="pt-4 border-t border-slate-100 space-y-3">
                            {session ? (
                                <>
                                    <Link href="/dashboard/eleve" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 border border-brand-orange/20">
                                            Mon Espace
                                        </Button>
                                    </Link>
                                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                                        Déconnexion
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-slate-400 hover:text-brand-orange hover:bg-white/5"
                                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                                    >
                                        Connexion
                                    </Button>
                                    <Button
                                        className="w-full bg-brand-orange hover:bg-brand-orange/90"
                                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                                    >
                                        Inscrivez-vous
                                    </Button>
                                </>
                            )}
                        </li>
                    </ul>
                </div>
            )}

            {/* Render Modal */}
            {mounted && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
        </header>
    );
}

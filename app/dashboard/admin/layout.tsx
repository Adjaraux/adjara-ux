'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    LogOut,
    ShieldAlert,
    Clock,
    Award,
    Briefcase,
    MessageSquare,
    Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { AdminMessageBadge } from '@/components/admin/message-badge';
import { RealtimeRefresher } from '@/components/dashboard/realtime-refresher';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Admin Sidebar Component (Inline for simplicity or extract later)
    const sidebarItems = [
        { icon: LayoutDashboard, label: 'Vue Globale', href: '/dashboard/admin' },
        { icon: MessageSquare, label: 'Messagerie', href: '/dashboard/admin/messages', badge: true },
        { icon: Inbox, label: 'Demandes', href: '/dashboard/admin/inscriptions' },
        { icon: Briefcase, label: 'Portfolio', href: '/dashboard/admin/portfolio' },
        { icon: Briefcase, label: 'Agence / Missions', href: '/dashboard/admin/agency' },
        { icon: BookOpen, label: 'Gestion des Cours', href: '/dashboard/admin/courses' },
        { icon: Clock, label: 'Examens & Suivi', href: '/dashboard/admin/attempts' },
        { icon: Award, label: 'Certifications', href: '/dashboard/admin/certifications' },
        { icon: Users, label: 'Utilisateurs', href: '/dashboard/admin/users' },
        { icon: Settings, label: 'Paramètres', href: '/dashboard/admin/settings' },
    ];

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar (Classic Light Theme) */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed h-full shadow-sm z-50">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 leading-tight">Admin</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">God Mode</p>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start mb-1 ${isActive
                                        ? 'bg-amber-50 text-amber-700 font-bold'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                                    {item.label}
                                    {/* @ts-ignore - straightforward dynamic check */}
                                    {item.badge && <AdminMessageBadge />}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Déconnexion
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 pl-64 transition-all duration-300">
                <RealtimeRefresher />
                {/* Header */}
                <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-end px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

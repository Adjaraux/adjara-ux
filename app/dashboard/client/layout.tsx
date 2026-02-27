'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Briefcase,
    PlusCircle,
    MessageSquare,
    Settings,
    LogOut,
    Building2,
    LayoutDashboard,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { RealtimeRefresher } from '@/components/dashboard/realtime-refresher';

export default function ClientDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Tableau de Bord', href: '/dashboard/client' },
        { icon: PlusCircle, label: 'Nouveau Projet', href: '/dashboard/client/projects/new' },
        { icon: Briefcase, label: 'Mes Projets', href: '/dashboard/client/projects' },
        { icon: MessageSquare, label: 'Messages', href: '/dashboard/client/messages', badge: true },
        { icon: Building2, label: 'Profil', href: '/dashboard/client/profile' },
        { icon: Settings, label: 'Paramètres', href: '/dashboard/client/settings' },
    ];

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        async function fetchUnreadCount() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .neq('sender_id', user.id)
                .eq('is_read', false);

            setUnreadCount(count || 0);
        }

        fetchUnreadCount();

        // Realtime for notifications
        const channel = supabase
            .channel('sidebar-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                fetchUnreadCount();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
                    <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-slate-900 leading-tight">Espace Client</h1>
                    <p className="text-xs text-slate-500">Agence Digitale</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/dashboard/client' && pathname.startsWith(item.href));

                    return (
                        <Button
                            key={item.href}
                            variant="ghost"
                            asChild
                            className={`w-full justify-start mb-1 transition-colors ${isActive
                                ? 'bg-orange-50 text-[#f6941d] font-bold shadow-sm'
                                : 'text-slate-600 hover:bg-orange-50 hover:text-[#f6941d]'
                                }`}
                        >
                            <Link href={item.href} className="flex items-center w-full relative">
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#f6941d]' : 'text-slate-400'}`} />
                                <span className="flex-1">{item.label}</span>
                                {item.badge && unreadCount > 0 && (
                                    <span className="bg-[#f6941d] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        </Button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    Déconnexion
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 border-r border-slate-200 fixed h-full z-10 flex-col">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 pl-0 md:pl-64 transition-all w-full">
                <RealtimeRefresher />
                <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 mb-6">
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="w-6 h-6 text-slate-600" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 border-none w-64">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <NotificationBell />
                    </div>
                </header>
                <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}

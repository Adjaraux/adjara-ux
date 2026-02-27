'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('notifications_header')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}` // Filter by user needs ID... wait, auth.uid() mostly works in RLS but for realtime filter we need explicit ID usually.
                },
                (payload) => {
                    console.log('New Notification!', payload);
                    fetchNotifications(); // Refresh list
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false); // Only unread ones

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'action_required': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-orange rounded-full border-2 border-[#05080f] shadow-laser-sm" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#05080f] border-white/10 shadow-2xl" align="end">
                <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h4 className="font-semibold text-sm text-white">Notifications</h4>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-brand-orange hover:text-brand-orange/80 font-medium"
                        >
                            Tout marquer comme lu
                        </button>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            Aucune notification
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 items-start ${!notification.is_read ? 'bg-brand-orange/5' : ''}`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="mt-1 shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notification.is_read ? 'font-semibold text-white' : 'text-slate-300'}`}>
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                        {notification.message}
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </span>
                                        {notification.link && (
                                            <Link
                                                href={notification.link}
                                                className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300 hover:text-brand-orange hover:border-brand-orange/50 transition-colors"
                                            >
                                                Voir
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-laser-sm mt-2 shrink-0" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

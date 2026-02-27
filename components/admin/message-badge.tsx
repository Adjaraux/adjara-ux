'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Badge } from '@/components/ui/badge';

export function AdminMessageBadge() {
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        // Fetch initial count
        async function fetchUnread() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Count messages where recipient is Admin (implied, meaning sender is NOT admin)
            // Since we don't have explicit 'recipient_id' on messages, we count unread messages sent by NOT this user.
            // But wait, the admin user ID is specific.
            // Better logic: Count messages where is_read = false AND sender_id != current_user.id
            // This assumes only admins view this component.

            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_id', user.id);

            if (!error && count !== null) {
                setUnreadCount(count);
            }
        }

        fetchUnread();

        // Subscribe to changes
        const channel = supabase
            .channel('admin-messages-badge')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT or UPDATE (is_read)
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    // Refresh count on any change for simplicity
                    fetchUnread();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    if (unreadCount === 0) return null;

    return (
        <Badge className="ml-auto bg-amber-500 text-slate-900 hover:bg-amber-400 h-5 px-1.5 min-w-[20px] justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
    );
}

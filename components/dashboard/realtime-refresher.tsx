'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export function RealtimeRefresher() {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        // Subscribe to critical tables that affect dashboard counts or lists
        const channel = supabase
            .channel('global-dashboard-refresher')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => {
                    // console.log('Project change detected, refreshing...');
                    router.refresh();
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => {
                    // console.log('New message, refreshing...');
                    router.refresh();
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => {
                    // console.log('New notification, refreshing...');
                    router.refresh();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_progress' },
                () => {
                    // console.log('Progress change, refreshing dashboard components...');
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, router]);

    return null; // Silent component
}

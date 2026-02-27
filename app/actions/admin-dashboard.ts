import { createClient } from '../../utils/supabase/server';
// Based on previous files, I see 'getAdminDashboardStats' imported but I suspect the utils path might be different.
// I will check a known good file for the import.
// Waittt, in the previous step I saw 'import { createBrowserClient } from '@supabase/ssr';' in client components.
// In server components/actions, it should be 'import { createClient } from '@/utils/supabase/server';' IF that file exists.
// I'll check if @/utils/supabase/server exists. The lint error said "Cannot find module".
// Let me first CHECK where createClient is defined for server.
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function getAdminDashboardStats() {
    const supabase = await createClient();

    try {
        // 1. Fetch Project Stats
        // We can do this in parallel or single query if we grouped by status, but simple separate queries are safer for now.

        // Open Projects (Validated, Waiting for Assignment)
        const { count: openCount, error: openError } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        // In Progress (Assigned, Working)
        const { count: progressCount, error: progressError } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'in_progress');

        // Total Stats for Revenue calculation (Completed or Delivered)
        // Ideally we sum 'final_price'
        const { data: revenueProjects, error: revenueError } = await supabase
            .from('projects')
            .select('final_price')
            .in('status', ['completed', 'delivered']);

        const totalRevenue = revenueProjects?.reduce((acc: number, curr: any) => acc + (curr.final_price || 0), 0) || 0;

        // 2. Fetch Recent Messages
        // We need sender info.
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select(`
                id,
                content,
                created_at,
                sender:profiles!sender_id (
                    full_name,
                    email,
                    avatar_url
                ),
                project:projects!project_id (
                    title
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        // 3. User Counts (Optional but nice)
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        // 4. Inscriptions Count
        const { count: inscriptionsCount } = await supabase.from('inscriptions').select('*', { count: 'exact', head: true });

        return {
            success: true,
            data: {
                openProjects: openCount || 0,
                inProgressProjects: progressCount || 0,
                totalRevenue: totalRevenue,
                totalUsers: userCount || 0,
                totalInscriptions: inscriptionsCount || 0,
                recentActivities: messages?.map((msg: any) => {
                    const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
                    const project = Array.isArray(msg.project) ? msg.project[0] : msg.project;

                    return {
                        id: msg.id,
                        content: msg.content,
                        created_at: msg.created_at,
                        sender_name: sender?.full_name || sender?.email,
                        sender_avatar: sender?.avatar_url,
                        project_title: project?.title
                    };
                }) || []
            }
        };

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return { success: false, message: "Erreur de chargement des stats" };
    }
}

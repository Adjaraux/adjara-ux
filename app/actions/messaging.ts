'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function sendMessageAction({ projectId, content, attachments = [] }: { projectId: string, content: string, attachments?: any[] }) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Non authentifié" };

    // RLS will handle permission checks (Admin or Client Owner)
    const { error } = await supabase.from('messages').insert({
        project_id: projectId,
        sender_id: user.id,
        content: content,
        attachments: attachments
    });

    if (error) {
        console.error("Send Message Error:", error);
        return { success: false, message: "Erreur lors de l'envoi." };
    }

    // Trigger is handled by DB for notifications
    // Realtime will handle UI update

    revalidatePath('/dashboard/client/messages');
    revalidatePath('/dashboard/admin/messages');
    revalidatePath(`/dashboard/client/projects/${projectId}`);

    return { success: true };
}

export async function getProjectMessages(projectId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:sender_id(email, role, full_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true }); // Oldest first for chat timeline

    if (error) {
        console.error("Fetch Messages Error:", error);
        return [];
    }

    return data;
}

export async function markMessagesRead(projectId: string) {
    // Mark all unread messages in this project as read for the CURRENT user
    // Logic: If I am Client, mark Admin messages as read.
    // If I am Admin, mark Client messages as read.
    // This requires a bit of logic or just "update messages set is_read=true where project_id=... and sender_id != me"

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .neq('sender_id', user.id)
        .is('is_read', false);

    revalidatePath('/dashboard/client/messages');
    revalidatePath('/dashboard/admin/messages');
}

import { createClient } from '@supabase/supabase-js';

// Use a Service Role client for notifications to ensure we can target ANY user
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type NotificationType = 'info' | 'success' | 'warning' | 'action_required';

export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
) {
    try {
        console.log(`[Notify] Sending to ${userId}: ${title}`);

        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                link,
                is_read: false
            });

        if (error) {
            console.error("[Notify] Failed to insert:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("[Notify] Exception:", e);
        return false;
    }
}

'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/utils/supabase-admin';
import { sendNotification } from '@/utils/notifications';

// --- Types ---
export interface SubmitDeliverableParams {
    projectId: string;
    fileUrl: string;
    fileName: string;
    fileType: 'design' | 'code' | 'other';
    comment?: string;
}

export async function submitDeliverableAction({ projectId, fileUrl, fileName, fileType, comment }: SubmitDeliverableParams) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Non authentifié" };

    // 1. Verify Ownership & State
    // We use Admin client for robust check, or could use RLS if policies are perfect.
    // Using Admin ensures we can check 'assigned_talent_id' reliably even if RLS is tricky.
    const admin = getAdminClient();

    const { data: project } = await admin
        .from('projects')
        .select('assigned_talent_id, status')
        .eq('id', projectId)
        .single();

    if (!project || project.assigned_talent_id !== user.id) {
        return { success: false, message: "Vous n'êtes pas assigné à ce projet." };
    }

    if (project.status !== 'in_progress') {
        return { success: false, message: "Ce projet n'est pas en cours." };
    }

    // 2. Insert Deliverable
    // User can insert because of RLS: "Uploader can manage deliverables"
    // But we might need Admin if we want to bypass some checks or be sure.
    // Let's use the USER client to respect RLS (good practice), or Admin if we want to be safe against RLS bugs.
    // Let's use Admin to ensure it works 100% since this is critical.

    const { error: insertError } = await admin.from('project_deliverables').insert({
        project_id: projectId,
        uploader_id: user.id,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        // comment: comment // If we add a comment column later
    });

    if (insertError) {
        console.error("Deliverable Insert Error:", insertError);
        return { success: false, message: "Erreur lors de l'enregistrement du fichier." };
    }

    // 3. Update Project Status & Notify Admin
    const { error: updateError } = await admin
        .from('projects')
        .update({
            status: 'review',
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

    if (updateError) {
        return { success: false, message: "Fichier envoyé mais erreur de mise à jour du statut." };
    }

    // 4. Notify ALL Admins (or system admin)
    // We don't have a specific 'admin' user ID easily here unless we query by role.
    // For MVP, we might skip this or fetch all admins. 
    // Or we simply created a 'notifications' record linked to the AGENCY ADMIN (if we had one).
    // WORKAROUND: For now, we will just trust the Admin Dashboard "Reviews" tab 
    // BUT user asked for NOTIFICATIONS.
    // Let's implement a 'broadcast to admins' or just pick the first admin found.

    // Better: Helper broadcastToAdmins
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
    if (admins) {
        for (const ad of admins) {
            await sendNotification(
                ad.id,
                "Livrable Reçu",
                "Un élève a soumis un travail. Vérifiez l'onglet Vérifications.",
                'action_required',
                '/dashboard/admin/agency'
            );
        }
    }

    return { success: true };
}

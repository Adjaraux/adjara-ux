'use server';

import { getAdminClient } from '@/utils/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function assignProjectAction({
    projectId,
    talentId,
    deadline,
    adminNotes
}: {
    projectId: string,
    talentId: string,
    deadline: Date, // Date object
    adminNotes?: string
}) {
    const admin = getAdminClient();

    // 1. Update Project
    const { error } = await admin
        .from('projects')
        .update({
            assigned_talent_id: talentId,
            deadline: deadline.toISOString(), // Timestamptz
            admin_notes: adminNotes,
            status: 'in_progress', // Move to In Progress
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

    if (error) {
        console.error("Assignment Error:", error);
        return { success: false, message: "Erreur lors de l'attribution." };
    }

    // 2. (Optional) Auto-accept application if exists
    // We try to update project_applications just to keep data clean
    // We don't fail if it doesn't exist (Manual assignment case)
    await admin
        .from('project_applications')
        .update({ status: 'accepted' })
        .eq('project_id', projectId)
        .eq('talent_id', talentId);

    // 3. (Optional) Reject others?
    // Let's keep it simple for now.

    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/admin/agency');
    revalidatePath(`/dashboard/client/projects/${projectId}`);
    revalidatePath(`/dashboard/eleve/missions/${projectId}`);

    return { success: true };
}

// Fetch potential talents (Simple list for dropdown)
// In a real app, this would be a search or paginated list.
export async function getCalculatedTalents() {
    const admin = getAdminClient();

    // Fetch profiles that have a certificate (Graduates)
    // This is a join or a filtered query.
    // Let's just fetch profiles with a 'student' role or similar.
    // Or better: Fetch Certificates distinct user_id, then fetch profiles.

    // Let's try fetching profiles directly for now.
    // Ideally we filter by 'is_graduated' if we had that flag, or check certificates.
    const { data: certs } = await admin.from('certificates').select('user_id');
    const graduateIds = Array.from(new Set(certs?.map((c: any) => c.user_id) || []));

    if (graduateIds.length === 0) return [];

    const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, email, specialty')
        .in('id', graduateIds);

    return profiles || [];
}

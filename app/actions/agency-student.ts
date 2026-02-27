'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/utils/supabase-admin';

// --- Types ---

export interface StudentMissionDTO {
    id: string;
    title: string;
    description: string;
    budget_range: string; // Range is public/safe
    final_price?: number; // Only if we want student to see it? Usually yes for "commission" calculation.
    deadline: string | null;
    specs: any;
    attachments: any[];
    status: string;
    // Computed/Safe Client Info
    client_industry: string | null;
    // NO NAME, NO PHONE, NO EMAIL
}

// --- The Airlock ---

export async function getStudentMissionDetails(projectId: string): Promise<{ success: boolean, mission?: StudentMissionDTO, error?: string }> {
    const cookieStore = await cookies();

    // 1. Authenticate Student
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 2. Fetch Project Data (Service Role)
    const admin = getAdminClient();

    const { data: project, error: projError } = await admin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (projError || !project) {
        console.error("Airlock Project Fetch Error:", projError);
        return { success: false, error: "Projet introuvable." };
    }

    // 3. Fetch Client Info (Safe Query)
    // We only fetch 'industry' and 'client_type' specifically.
    // Assuming agency_clients PK is same as profiles PK (client_id).
    const { data: clientData, error: clientError } = await admin
        .from('agency_clients')
        .select('industry, client_type')
        .eq('id', project.client_id)
        .single();

    // Note: If clientData is missing (e.g. not an agency client yet), we handle gracefully.

    // 4. Verify Access Rights
    // STRICT: Student MUST be assigned. No "Open" viewing.
    const isAssignedToMe = project.assigned_talent_id === user.id;

    if (!isAssignedToMe) {
        return { success: false, error: "Accès refusé. Vous n'êtes pas assigné à cette mission." };
    }

    // 5. Sanitize & Return DTO
    const dto: StudentMissionDTO = {
        id: project.id,
        title: project.title,
        description: project.description,
        budget_range: project.budget_range,
        final_price: isAssignedToMe ? project.final_price : undefined,
        deadline: project.deadline,
        specs: project.specs || {},
        attachments: project.attachments || [],
        status: project.status,
        client_industry: clientData?.industry || "Secteur Inconnu"
    };

    return { success: true, mission: dto };
}

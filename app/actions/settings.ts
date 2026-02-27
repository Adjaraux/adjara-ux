'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Type Definition for Certificate Settings
export interface CertificateSettings {
    title: string;
    subtitle: string;
    primaryColor: string;
    secondaryColor: string;
    signatureName: string;
    signatureRole: string;
    logoText: string;
    showLogo: boolean;
    showSignature: boolean;
    logoUrl?: string; // Optional external URL
    signatureUrl?: string; // Optional external URL
}

// Helper: Get Admin Client
async function getAdminClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role for Admin Actions
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );
}

// helper: get public client for reading
async function getPublicClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );
}


export async function getCertificateSettings(): Promise<CertificateSettings> {
    const supabase = await getPublicClient();

    const { data, error } = await supabase
        .from('academy_settings')
        .select('value')
        .eq('key', 'certificate_default')
        .single();

    if (error || !data) {
        console.warn("Could not fetch certificate settings, returning defaults.", error);
        return {
            title: "Certificat de Réussite",
            subtitle: "Décerné officiellement à",
            primaryColor: "#4f46e5",
            secondaryColor: "#1e293b",
            signatureName: "L'Équipe Pédagogique",
            signatureRole: "Direction Académique",
            logoText: "ACADEMY",
            showLogo: true,
            showSignature: true
        };
    }

    return data.value as CertificateSettings;
}

export async function updateCertificateSettings(settings: CertificateSettings) {
    const supabase = await getAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Security Check: Verify user is admin (Double check in DB if needed, but RLS handles it mostly)
    // The getAdminClient uses service role, so strictly speaking we bypass RLS, 
    // BUT we should verify the *calling* user is an admin logic if we weren't using service role.
    // Ideally we should use standard client + RLS.
    // Let's switch to standard client for the update to respect RLS policies implemented in migration.

    const cookieStore = await cookies();
    const standardSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );

    const { error } = await standardSupabase
        .from('academy_settings')
        .upsert({
            key: 'certificate_default',
            value: settings,
            updated_by: user.id
        });

    if (error) {
        console.error("Failed to update settings:", error);
        throw new Error("Erreur lors de la mise à jour des paramètres.");
    }

    return { success: true };
}

// ... (Previous code)

// USER MANAGEMENT
export async function toggleUserStatus(userId: string, newStatus: string) {
    const supabase = await getAdminClient(); // Use Service Role to bypass potential RLS on 'status' update if strict
    // Actually, we should check if the caller is admin first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // We can do a quick check on profiles role via RLS-compliant query if we want, 
    // but getAdminClient() is god-mode. 
    // We trust this action is only called by admin layout which is protected? 
    // Ideally we verify isAdmin() in DB.

    // Double check caller is admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return { success: false, message: "Action réservée aux administrateurs." };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

    if (error) {
        console.error("Error toggling user status:", error);
        return { success: false, message: "Erreur mise à jour statut." };
    }

    return { success: true };
}

// AGENCY SETTINGS

export interface AgencySettings {
    company_name: string;
    address: string;
    siret: string;
    email_contact: string;
    logo_url: string;
    vat_rate: number;
}

export async function getAgencySettings(): Promise<AgencySettings> {
    const supabase = await getPublicClient();

    const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .single();

    if (error || !data) {
        // Return defaults if empty
        return {
            company_name: 'Antygravity Agency',
            address: '',
            siret: '',
            email_contact: '',
            logo_url: '',
            vat_rate: 20
        };
    }

    return {
        company_name: data.company_name || 'Antygravity Agency',
        address: data.address || '',
        siret: data.siret || '',
        email_contact: data.email_contact || '',
        logo_url: data.logo_url || '',
        vat_rate: data.vat_rate || 20
    };
}

export async function updateAgencySettings(settings: AgencySettings) {
    const supabase = await getAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: "Unauthorized" };

    // Check Admin Role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return { success: false, message: "Action réservée aux administrateurs." };
    }

    // We strictly follow the singleton pattern: only one row allowed.
    const { data: existing, error: fetchError } = await supabase.from('agency_settings').select('id').single();

    let error;

    if (existing) {
        // Clear id from settings if it exists to avoid primary key conflicts
        const { id, ...updateData } = settings as any;
        const res = await supabase.from('agency_settings').update(updateData).eq('id', existing.id);
        error = res.error;
    } else {
        // First time initialization
        const res = await supabase.from('agency_settings').insert([settings]);
        error = res.error;
    }

    if (error) {
        console.error("Error updating agency settings:", error);
        return { success: false, message: `Erreur sauvegarde : ${error.message}` };
    }

    return { success: true };
}

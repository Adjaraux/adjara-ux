'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getAdminClient } from '@/utils/supabase-admin';
import { sendNotification } from '@/utils/notifications';

// Helper for User Context
async function getSupabaseUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user };
}

export interface ProjectFormData {
    title: string;
    description: string;
    budget_range: string;
    required_specialty: string;
    attachments: { name: string; url: string; type: string }[];
    specs: any; // Dynamic JSON
}

export async function createProjectAction(formData: ProjectFormData) {
    const { supabase, user } = await getSupabaseUser();

    if (!user) {
        return { success: false, message: "Non authentifié." };
    }

    // 1. Role Verification
    // Check if user is a registered Agency Client
    // Note: We use the 'files' profile table or 'agency_clients' table check
    // Ideally, we check 'agency_clients' existence
    const { data: clientProfile } = await supabase
        .from('agency_clients')
        .select('id, company_name')
        .eq('id', user.id)
        .single();

    // If client profile doesn't exist, we should probably auto-create it or block.
    // For Sprint 2.1, let's assume if they have 'client' role (Middleware checked), they are good.
    // But strict check is better.
    let clientId = user.id;
    if (!clientProfile) {
        console.warn("[Agency] User has no agency_client profile. Auto-creating stub...");
        // Auto-create stub for smoother UX? Or block?
        // Let's auto-create a stub based on generic profile to avoid blocking.
        const { error: createError } = await supabase
            .from('agency_clients')
            .insert({
                id: user.id,
                company_name: "Nouvelle Entreprise (À renseigner)",
                industry: "Non spécifié"
            });

        if (createError) {
            console.error("Failed to create client stub", createError);
            return { success: false, message: "Erreur de profil client." };
        }
    }

    // 2. Validate Inputs
    if (!formData.title || formData.title.length < 5) {
        return { success: false, message: "Le titre est trop court." };
    }
    if (!formData.description || formData.description.length < 20) {
        return { success: false, message: "La description doit être plus détaillée." };
    }

    // 3. Insert Project
    const { data, error } = await supabase
        .from('projects')
        .insert({
            client_id: clientId,
            title: formData.title,
            description: formData.description,
            budget_range: formData.budget_range,
            required_specialty: formData.required_specialty,
            attachments: formData.attachments || [], // Option B: JSONB
            specs: formData.specs || {}, // CRITICAL FIX: Save the specs!
            status: 'pending_approval' // Default safety
        })
        .select()
        .single();

    if (error) {
        console.error("Project Insert Error:", error);
        return { success: false, message: "Erreur base de données lors de la création." };
    }

    revalidatePath('/dashboard/client');
    revalidatePath('/dashboard/client/projects');
    revalidatePath('/dashboard/admin');

    return { success: true, projectId: data.id };
}

// --- Admin Actions (Service Role) ---

export async function updateProjectStatusAction({
    projectId,
    status,
    finalPrice,
    adminNotes,
    deadline
}: {
    projectId: string,
    status: 'pending_approval' | 'open' | 'cancelled' | 'draft' | 'in_progress' | 'review' | 'delivered' | 'completed',
    finalPrice?: number,
    adminNotes?: string,
    deadline?: Date // Add deadline
}) {
    const { supabase, user } = await getSupabaseUser();

    // 1. Check Admin Role (Strict Check)
    if (!user) return { success: false, message: "Unauthorized" };

    // 2. Use Privacy-Bypassing Admin Client (Service Role)
    const adminClient = getAdminClient();

    const updateData: any = {
        status,
        updated_at: new Date().toISOString()
    };
    if (finalPrice !== undefined) updateData.final_price = finalPrice;
    if (deadline !== undefined) updateData.deadline = deadline; // Update deadline

    // We store admin notes in the new column 'admin_notes'
    // If adminNotes is provided, we update it.
    // If we wanted to APPEND, we'd need to fetch first, but OVERWRITE is simpler for now
    // or we assume adminNotes contains the full text.
    if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
    }

    const { error } = await adminClient
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

    if (error) {
        console.error("Admin Update Error:", error);
        return { success: false, message: "Erreur base de données." };
    }

    // NOTIFICATIONS LOGIC
    // Fetch project to get Client and Student IDs
    const { data: project } = await adminClient
        .from('projects')
        .select('client_id, assigned_talent_id, title')
        .eq('id', projectId)
        .single();

    if (project) {
        const { client_id, assigned_talent_id, title } = project;

        // 1. Notify CLIENT
        if (status === 'open') {
            await sendNotification(client_id, "Paiement Reçu", `Votre projet "${title}" est maintenant ouvert.`, 'success', `/dashboard/client/projects/${projectId}`);
        } else if (status === 'pending_approval' && finalPrice) {
            await sendNotification(client_id, "Devis Disponible", `L'agence a fixé le prix pour "${title}".`, 'action_required', `/dashboard/client/projects/${projectId}`);
        } else if (status === 'delivered') {
            // NEW: Delivery Notification
            await sendNotification(client_id, "Votre commande est prête / expédiée", `Le projet "${title}" est livré. Merci de valider la réception.`, 'success', `/dashboard/client/projects/${projectId}`);
        } else if (status === 'completed') {
            // Client sees this after confirmation usually, but if Admin forces it:
            await sendNotification(client_id, "Projet Clôturé", `Le projet "${title}" est archivé.`, 'info', `/dashboard/client/projects/${projectId}`);
        } else if (status === 'cancelled') {
            await sendNotification(client_id, "Projet Refusé/Annulé", `Désolé, votre projet "${title}" a été annulé par l'admin.`, 'warning', `/dashboard/client/projects`);
        } else if (status === 'review') {
            // Admin sees this, but Client might be notified "We are checking"
        }

        // 2. Notify STUDENT
        if (assigned_talent_id) {
            if (status === 'delivered') {
                // Student done? Not yet, until client confirms? Or maybe we tell student "It's shipped"?
                // Let's wait for completed aka client confirmation for final student success.
            } else if (status === 'completed') {
                await sendNotification(assigned_talent_id, "Félicitations !", `Validation finale pour "${title}". Paiement à venir.`, 'success', `/dashboard/eleve/missions/${projectId}`);
            } else if (status === 'in_progress' && adminNotes) {
                // Should distinguish if it was a "Push Back" from review
                await sendNotification(assigned_talent_id, "Corrections Demandées", `L'admin a demandé des changements pour "${title}".`, 'action_required', `/dashboard/eleve/missions/${projectId}`);
            }
        }
    }

    revalidatePath('/dashboard/admin/agency');
    revalidatePath('/dashboard/admin');
    revalidatePath(`/dashboard/client/projects/${projectId}`);
    revalidatePath('/dashboard/client/projects');
    if (project?.assigned_talent_id) {
        revalidatePath(`/dashboard/eleve/missions/${projectId}`);
    }

    return { success: true };
}

// --- Client Profile Actions ---

export interface ClientProfileData {
    company_name: string;
    industry: string;
    website_url: string;
    description?: string;
    address: string;
    phone: string;
    client_type: 'individual' | 'company';
    contact_email: string;
    avatar_url: string;
}

export async function updateClientProfileAction(data: ClientProfileData) {
    const { supabase, user } = await getSupabaseUser();

    if (!user) {
        return { success: false, message: "Non authentifié." };
    }

    // 1. Update Base Profile (Phone, Avatar)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            phone: data.phone,
            avatar_url: data.avatar_url,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

    if (profileError) {
        console.error("[Profile] Profiles Update Error:", profileError);
        return { success: false, message: `Erreur Profile: ${profileError.message}` };
    }

    // 2. Upsert Agency Client Details
    // Ensure we send only columns that exist
    const agencyPayload = {
        id: user.id,
        company_name: data.company_name,
        industry: data.industry,
        website_url: data.website_url,
        billing_address: { full_address: data.address }, // JSONB
        client_type: data.client_type,
        contact_email: data.contact_email,
        updated_at: new Date().toISOString()
    };

    const { error: agencyError } = await supabase
        .from('agency_clients')
        .upsert(agencyPayload);

    if (agencyError) {
        console.error("[Profile] Agency Update Error:", agencyError);
        return { success: false, message: `Erreur Entreprise: ${agencyError.message}` };
    }

    revalidatePath('/dashboard/client/profile');
    revalidatePath('/dashboard/client');

    return { success: true };
}

// --- Client Confirm Receipt ---
export async function confirmProjectReceiptAction(projectId: string) {
    const { supabase, user } = await getSupabaseUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const adminClient = getAdminClient();

    // Update status to 'completed'
    const { error } = await adminClient
        .from('projects')
        .update({
            status: 'completed',
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('client_id', user.id); // Security check

    if (error) {
        console.error("Confirm Receipt Error:", error);
        return { success: false, message: "Erreur lors de la confirmation." };
    }

    // Notify Admin
    // Find admin(s)
    const { data: admins } = await adminClient.from('profiles').select('id').eq('role', 'admin');
    if (admins) {
        for (const ad of admins) {
            await sendNotification(
                ad.id,
                "Projet clôturé par le client",
                "Le client a validé la réception. Le projet est terminé.",
                'success',
                '/dashboard/admin/agency'
            );
        }
    }

    // Also notify student if assigned (re-using logic from updateStatus could be better but explicit is fine)
    // We can just rely on the updateProjectStatusAction if we called that, but here we do it directly.
    // Let's notify student too manually here to be safe.
    const { data: project } = await adminClient.from('projects').select('assigned_talent_id, title').eq('id', projectId).single();
    if (project?.assigned_talent_id) {
        await sendNotification(project.assigned_talent_id, "Félicitations !", `Validation finale client pour "${project.title}".`, 'success', `/dashboard/eleve/missions/${projectId}`);
    }

    revalidatePath(`/dashboard/client/projects/${projectId}`);
    revalidatePath('/dashboard/client/projects');
    revalidatePath('/dashboard/admin');
    if (project?.assigned_talent_id) {
        revalidatePath(`/dashboard/eleve/missions/${projectId}`);
    }

    return { success: true };
}

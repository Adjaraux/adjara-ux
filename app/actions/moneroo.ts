'use server';

import { unlockProject } from '@/app/actions/payments-central';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user };
}

/**
 * [DEV] Simulate a successful Moneroo payment.
 */
export async function simulateMonerooPayment({
    projectId,
    packType,
    amount
}: {
    projectId?: string;
    packType?: 'essentiel' | 'expert' | 'master';
    amount: number;
}) {
    const isDev = process.env.NODE_ENV === 'development';

    // Safety check: Only allow in DEV mode
    if (!isDev) {
        return { success: false, error: "Simulation not allowed in production" };
    }

    const { user } = await getSupabaseUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Call Central Brain
    const result = await unlockProject({
        targetType: projectId ? 'mission' : 'formation',
        projectId: projectId,
        packType: packType,
        userId: user.id,
        amount: amount,
        currency: 'XOF',
        provider: 'moneroo',
        providerRef: `moneroo_sim_${Date.now()}`,
        metadata: {
            method: 'mobile_money',
            simulated: true
        }
    });

    return result;
}

/**
 * Initialize a real Moneroo payment (Standard Integration)
 */
export async function initializeMonerooPayment({
    projectId,
    packType,
    amount
}: {
    projectId?: string;
    packType?: 'essentiel' | 'expert' | 'master';
    amount: number;
}) {
    const { user } = await getSupabaseUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const secretKey = process.env.MONEROO_SECRET_KEY;
    if (!secretKey) {
        console.error("❌ MISSING MONEROO_SECRET_KEY");
        return { success: false, error: "Configuration de paiement manquante." };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Prepare metadata
    const metadata: Record<string, string> = {
        userId: user.id,
    };
    if (projectId) metadata.projectId = projectId;
    if (packType) metadata.packType = packType;

    try {
        const response = await fetch('https://api.moneroo.io/v1/payments/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secretKey}`,
            },
            body: JSON.stringify({
                amount: Math.round(amount),
                currency: 'XOF',
                description: projectId ? `Paiement Mission #${projectId.substring(0, 8)}` : `Achat Pack Académie ${packType?.toUpperCase()}`,
                customer: {
                    email: user.email,
                    first_name: user.user_metadata?.full_name?.split(' ')[0] || 'Client',
                    last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Adjara',
                },
                return_url: `${baseUrl}/payment/success`,
                metadata: metadata
            }),
        });

        const data = await response.json();

        if (data.status === 'success' || (data.data && data.data.checkout_url)) {
            return {
                success: true,
                checkout_url: data.data.checkout_url,
                transaction_id: data.data.id
            };
        } else {
            console.error("❌ Moneroo API Error:", data);
            return { success: false, error: data.message || "Erreur lors de l'initialisation du paiement." };
        }
    } catch (error) {
        console.error("❌ Moneroo Fetch Error:", error);
        return { success: false, error: "Erreur de connexion avec Moneroo." };
    }
}

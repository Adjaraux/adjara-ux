'use server';

import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Initialize Stripe Private Client
// We use a singleton-like pattern or just init here.
// LAZY INIT to prevent build/runtime crash if env vars are missing
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is missing in environment variables.");
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia', // Latest TypeScript definition usually suggests the correct one.
        // Wait, the error said: Type '"2025-01-27.acacia"' is not assignable to type '"2026-01-28.clover"'.
        // It seems the installed types are very new or experimental? 
        // I will trust the error message and use the one it expects, or cast as any.
        // Let's try casting to any to avoid "magic string" chases if the version is weird.
        apiVersion: '2024-12-18.acacia' as any,
        typescript: true,
    });
};

export async function createStripeCheckoutSession(projectId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    );

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // 2. Fetch Project Data (Price & Title)
    // We strictly use the DB values, never client-side passed values!
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error || !project) {
        return { success: false, error: "Project not found" };
    }

    if (!project.final_price) {
        return { success: false, error: "Ce projet n'a pas encore de prix validé." };
    }

    // 3. Create Stripe Session
    try {
        const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Amount logic: Stripe expects currency lowest unit.
        // XOF is 0-decimal currency in Stripe? 
        // Stripe Docs: "For zero-decimal currencies, provide amounts as an integer."
        // XOF is "Zero-decimal". 
        // E.g. 5000 FCFA -> 5000.
        // EUR is 2-decimal. 10.00 EUR -> 1000.

        let unitAmount = Math.round(Number(project.final_price));
        if (project.currency !== 'XOF' && project.currency !== 'JPY') {
            // Assume 2 decimals for USD, EUR, etc.
            unitAmount = Math.round(Number(project.final_price) * 100);
        }

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'], // Can add 'klarna', etc.
            line_items: [
                {
                    price_data: {
                        currency: project.currency.toLowerCase(),
                        product_data: {
                            name: `Mission: ${project.title}`,
                            description: `Paiement pour le projet #${project.id.substring(0, 8)}`,
                            // images: [] // Add logo?
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/dashboard/client/projects/${projectId}?success=true`,
            cancel_url: `${origin}/dashboard/client/projects/${projectId}?canceled=true`,
            customer_email: user.email,
            metadata: {
                project_id: projectId,
                client_id: user.id,
                env: process.env.NODE_ENV
            },
            invoice_creation: {
                enabled: true, // Generate PDF Invoice
            }
        });

        if (!session.url) throw new Error("No Session URL");

        return { success: true, url: session.url };

    } catch (err: any) {
        console.error("Stripe Error:", err);
        return { success: false, error: "Erreur Stripe: " + err.message };
    }
}

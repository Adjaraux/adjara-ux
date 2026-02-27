'use server';

import { getAdminClient } from '@/utils/supabase-admin';
import { revalidatePath } from 'next/cache';
import { sendNotification } from '@/utils/notifications';
import { addMonths, format } from 'date-fns';
import { generateInvoiceBuffer } from '@/lib/utils/invoice-generator';

// --- Types ---

export type PaymentProvider = 'stripe' | 'cinetpay' | 'moneroo' | 'manual';
export type PaymentTarget = 'mission' | 'formation';

export interface UnlockPaymentParams {
    targetType: PaymentTarget;
    userId: string; // The Payer
    amount: number;
    currency: string;
    provider: PaymentProvider;
    providerRef: string; // Transaction ID
    projectId?: string; // Required if targetType is 'mission'
    packType?: 'essentiel' | 'expert' | 'master'; // Required if targetType is 'formation'
    metadata?: any;
    receiptUrl?: string;
}

/**
 * THE CENTRAL BRAIN 🧠
 * Unifies all payment success logic for the entire platform.
 */
export async function unlockProject({
    targetType,
    userId,
    amount,
    currency,
    provider,
    providerRef,
    projectId,
    packType,
    metadata,
    receiptUrl: providedReceiptUrl
}: UnlockPaymentParams) {
    const admin = getAdminClient();

    // 1. Idempotency Check (Ledger)
    const { data: existingTx } = await admin
        .from('agency_transactions')
        .select('id, receipt_url')
        .eq('provider', provider)
        .eq('provider_ref', providerRef)
        .single();

    if (existingTx) {
        console.warn("[Payment] Transaction already processed:", providerRef);
        return { success: true, message: "Transaction déjà traitée.", receiptUrl: existingTx.receipt_url };
    }

    // 2. Fetch User Profile for Invoice
    const { data: profile } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

    const customerName = profile?.full_name || profile?.email || "Client Adjara UX";

    // 1. Record Transaction (Ledger)
    const { data: tx, error: txError } = await admin
        .from('agency_transactions')
        .insert({
            project_id: projectId || null,
            user_id: userId,
            amount: amount,
            currency: currency,
            provider: provider,
            provider_ref: providerRef,
            type: targetType === 'mission' ? 'full_payment' : 'subscription',
            status: 'success',
            metadata: {
                ...metadata,
                targetType,
                packType,
                projectName: projectId ? (await admin.from('projects').select('title').eq('id', projectId).single()).data?.title : undefined
            },
            receipt_url: providedReceiptUrl || null
        })
        .select()
        .single();

    if (txError) {
        console.error("[Payment] Ledger Error:", txError);
        return { success: false, error: "Erreur enregistrement transaction" };
    }

    // 4. AUTOMATED INVOICE GENERATION
    let finalReceiptUrl = providedReceiptUrl;
    if (!finalReceiptUrl) {
        try {
            console.log("[Invoice] Generating automated receipt...");
            const invoiceData = {
                invoiceNumber: `ADJ-${Date.now()}-${tx.id.substring(0, 4).toUpperCase()}`,
                date: format(new Date(), 'dd/MM/yyyy'),
                customerName,
                projectTitle: projectId ? (metadata?.projectName || "Projet Agence") : `Pack Académie ${packType?.toUpperCase()}`,
                amount,
                currency,
                provider
            };

            const buffer = await generateInvoiceBuffer(invoiceData);
            const fileName = `receipts/${userId}/${invoiceData.invoiceNumber}.pdf`;

            const { error: uploadError } = await admin.storage
                .from('receipts')
                .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

            if (!uploadError) {
                const { data: urlData } = admin.storage.from('receipts').getPublicUrl(fileName);
                finalReceiptUrl = urlData.publicUrl;

                // Update transaction with the new receipt URL
                await admin.from('agency_transactions').update({ receipt_url: finalReceiptUrl }).eq('id', tx.id);
                console.log("[Invoice] Receipt stored:", finalReceiptUrl);
            } else {
                console.error("[Invoice] Upload Error:", uploadError);
            }
        } catch (invErr) {
            console.error("[Invoice] Generation Error:", invErr);
        }
    }

    const formattedAmount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(amount);

    // 3. Target Specific Logic
    if (targetType === 'mission' && projectId) {
        // --- AGENCY MISSION LOGIC ---
        const { data: project } = await admin.from('projects').select('*').eq('id', projectId).single();
        if (project) {
            const validStatuses = ['draft', 'pending_approval'];
            if (validStatuses.includes(project.status)) {
                await admin.from('projects').update({
                    status: 'open',
                    payment_status: 'paid',
                    updated_at: new Date().toISOString()
                }).eq('id', projectId);
            } else {
                await admin.from('projects').update({ payment_status: 'paid' }).eq('id', projectId);
            }

            // Notifications
            await sendNotification(userId, "Paiement Confirmé ✅", `Votre projet "${project.title}" est maintenant OUVERT. Votre facture est disponible dans votre dashboard.`, 'success', `/dashboard/client/projects/${projectId}`);

            // Notify All Admins
            const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
            if (admins) {
                for (const adm of admins) {
                    await sendNotification(adm.id, "Nouveau Paiement Mission ! 💰", `Projet "${project.title}" financé (${formattedAmount}).`, 'success', '/dashboard/admin/agency');
                }
            }
        }
    } else if (targetType === 'formation' && packType) {
        // --- EDUCATION FORMATION LOGIC ---
        let monthsToAdd = 0;
        if (packType === 'essentiel') monthsToAdd = 9;
        if (packType === 'expert') monthsToAdd = 27;
        if (packType === 'master') monthsToAdd = 36;

        const newEndDate = addMonths(new Date(), monthsToAdd).toISOString();

        await admin.from('profiles').update({
            pack_type: packType,
            subscription_end: newEndDate
        }).eq('id', userId);

        // Notifications
        await sendNotification(userId, "Formation Débloquée ! 🎓", `Félicitations ! Votre accès au pack ${packType.toUpperCase()} est actif jusqu'en ${new Date(newEndDate).getFullYear()}.`, 'success', '/dashboard/eleve/learning');

        // Notify All Admins
        const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
        if (admins) {
            for (const adm of admins) {
                await sendNotification(adm.id, "Nouvel Élève Inscrit ! 🎓", `Un pack ${packType.toUpperCase()} a été acheté (${formattedAmount}).`, 'success', '/dashboard/admin/users');
            }
        }
    }

    // 4. Revalidate

    return { success: true, receiptUrl: finalReceiptUrl };
}

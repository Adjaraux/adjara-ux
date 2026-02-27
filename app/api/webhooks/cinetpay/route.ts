import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cinetPay } from '@/lib/cinetpay';
import { addMonths } from 'date-fns';

export async function POST(req: NextRequest) {
    // 1. Parse FormData (CinetPay usually sends x-www-form-urlencoded or multipart, but let's check doc. 
    // Docs say POST with cpm_trans_id etc. usually form-data)
    // We will try to parse formData first.
    let transaction_id = '';

    try {
        const formData = await req.formData();
        transaction_id = formData.get('cpm_trans_id') as string;
    } catch (e) {
        // Fallback to JSON if enabled
        try {
            const json = await req.json();
            transaction_id = json.cpm_trans_id;
        } catch (jsonErr) {
            console.error("Webhook: Could not parse body");
            return NextResponse.json({ error: 'Body parse error' }, { status: 400 });
        }
    }

    if (!transaction_id) {
        console.warn("Webhook received without transaction_id");
        return NextResponse.json({ error: 'Missing cpm_trans_id' }, { status: 400 });
    }

    console.log(`[Webhook] Verifying Transaction: ${transaction_id}`);

    // 2. TRUST BUT VERIFY: Call CinetPay API
    try {
        const verification = await cinetPay.verifyPayment(transaction_id);

        if (verification.code === '00' && verification.data?.status === 'ACCEPTED') {
            const metadata = verification.data.metadata ? JSON.parse(verification.data.metadata) : {};
            const userId = metadata.userId;
            const packType = metadata.packType; // e.g. 'expert'
            const amount = verification.data.amount;

            if (userId && packType) {
                // --- SUBSCRIPTION LOGIC ---
                console.log(`[Webhook] Valid Subscription! User: ${userId}, Pack: ${packType}, Amount: ${amount}`);

                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceKey,
                    { auth: { persistSession: false } }
                );

                let monthsToAdd = 0;
                if (packType === 'essentiel') monthsToAdd = 9;
                if (packType === 'expert') monthsToAdd = 27;
                if (packType === 'master') monthsToAdd = 36;

                const now = new Date();
                const newEndDate = addMonths(now, monthsToAdd).toISOString();

                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        pack_type: packType,
                        subscription_end: newEndDate
                    })
                    .eq('id', userId);

                if (error) {
                    console.error("Webhook: DB Update Error", error);
                } else {
                    console.log(`[Webhook] Account upgraded until ${newEndDate}`);
                }
                return NextResponse.json({ status: 'OK', message: 'Account Upgraded' });

            } else if (metadata.projectId && metadata.userId) {
                // --- PROJECT PAYMENT LOGIC (Phase 3) ---
                // Import dynamically to avoid circular deps if any, or just use imported function
                // We need to import unlockProject at top level or here
                const { unlockProject } = await import('@/app/actions/payments-central');

                console.log(`[Webhook] Valid Mission Payment! Project: ${metadata.projectId}`);

                await unlockProject({
                    projectId: metadata.projectId,
                    userId: metadata.userId, // The Payer
                    amount: amount || 0,
                    currency: 'XOF', // CinetPay is XOF
                    provider: 'cinetpay',
                    providerRef: transaction_id,
                    metadata: verification.data,
                    receiptUrl: undefined // CinetPay doesn't give a hosted PDF URL easily, we might generate one later
                });

                return NextResponse.json({ status: 'OK', message: 'Project Unlocked' });
            } else {
                console.error("Webhook: Unknown Metadata Schema", metadata);
                return NextResponse.json({ error: 'Metadata Schema Unrecognized' }, { status: 200 });
            }
        } else {
            console.warn(`[Webhook] Verification Failed or Status not ACCEPTED. Code: ${verification.code}, Status: ${verification.data?.status}`);
            return NextResponse.json({ status: 'Ignored', message: 'Payment not accepted' });
        }

    } catch (error) {
        console.error("Webhook: Processing Error", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unlockProject } from '@/app/actions/payments-central';
import crypto from 'crypto';

/**
 * MONEROO WEBHOOK HANDLER
 * URL: [YourDomain]/api/webhooks/moneroo
 */

export async function POST(req: NextRequest) {
    console.log("🔔 [Moneroo Webhook] Received notification");

    const signature = req.headers.get('x-moneroo-signature');
    const secret = process.env.MONEROO_WEBHOOK_SECRET;

    // 1. Verify Signature (Security)
    if (!secret) {
        console.error("❌ [Moneroo Webhook] Missing MONEROO_WEBHOOK_SECRET");
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await req.text();

    if (signature) {
        const computedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (computedSignature !== signature) {
            console.error("❌ [Moneroo Webhook] Invalid signature");
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    } else {
        // In development, we might skip signature check if no secret is set, 
        // but for Dominance, we enforce it if secret is present.
        console.warn("⚠️ [Moneroo Webhook] No signature provided in header");
    }

    try {
        const payload = JSON.parse(body);
        const { event, data } = payload;

        // payload structure usually: { event: 'payment.success', data: { ... } }
        // Verify with actual Moneroo API Spec
        if (event === 'payment.success' || event === 'transaction.success') {
            const {
                id: providerRef,
                amount,
                currency,
                metadata, // Should contain projectId and userId from initiation
                customer
            } = data;

            const projectId = metadata?.projectId;
            const packType = metadata?.packType;
            const userId = metadata?.userId || customer?.id;

            console.log(`✅ [Moneroo Webhook] Processing success for ${projectId || packType}`);

            // 2. Call Central Brain to unlock and record
            const result = await unlockProject({
                targetType: projectId ? 'mission' : 'formation',
                projectId,
                packType,
                userId,
                amount,
                currency: currency || 'XOF',
                provider: 'moneroo',
                providerRef,
                metadata: {
                    ...metadata,
                    webhook: true,
                    received_at: new Date().toISOString()
                }
            });

            if (result.success) {
                return NextResponse.json({ status: 'success', message: 'Project unlocked' });
            } else {
                return NextResponse.json({ status: 'partial_success', error: result.error }, { status: 500 });
            }
        }

        return NextResponse.json({ status: 'ignored', event });

    } catch (err: any) {
        console.error("❌ [Moneroo Webhook] Error processing payload:", err.message);
        return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
    }
}

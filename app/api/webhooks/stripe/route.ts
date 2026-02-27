import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { unlockProject } from '@/app/actions/payments-central';

// LAZY INIT
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is missing.");
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
        typescript: true,
    });
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    let event: Stripe.Event;
    const sig = req.headers.get('stripe-signature');

    // --- DEV SIMULATION BYPASS ---
    // Allows testing the logic without valid Stripe Keys/Signature
    const isDev = process.env.NODE_ENV === 'development';
    const bypassHeader = req.headers.get('x-stripe-simulate-bypass');

    if (isDev && bypassHeader === 'true') {
        console.log("⚠️  DEV MODE: Bypassing Stripe Signature Verification");
        try {
            const body = await req.json();
            // In simulation, we expect the body to BE the event object directly
            event = body;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON Simulation Body' }, { status: 400 });
        }
    } else {
        // PRODUCTION / STANDARD MODE
        const sig = req.headers.get('stripe-signature');
        if (!sig || !endpointSecret) {
            console.error("⚠️  Missing Signature or STRIPE_WEBHOOK_SECRET");
            return NextResponse.json({ error: 'Missing Signature or Secret' }, { status: 400 });
        }

        try {
            const body = await req.text(); // Raw Body is required for signature verification
            event = getStripe().webhooks.constructEvent(body, sig, endpointSecret);
        } catch (err: any) {
            console.error(`⚠️  Webhook signature verification failed.`, err.message);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const projectId = session.metadata?.project_id;
        const clientId = session.metadata?.client_id;

        // Retrieve Invoice URL (hosted) if available
        let receiptUrl = null;
        if (session.invoice) {
            // DEV MOCK: Don't call Stripe API if bypassed
            if (isDev && bypassHeader === 'true') {
                receiptUrl = "https://mock.stripe.com/invoice.pdf";
            } else {
                try {
                    const invoice = await getStripe().invoices.retrieve(session.invoice as string);
                    receiptUrl = invoice.hosted_invoice_url || invoice.invoice_pdf;
                } catch (e) {
                    console.warn("Could not fetch invoice:", e);
                }
            }
        }

        if (projectId && clientId) {
            await unlockProject({
                projectId: projectId,
                userId: clientId,
                amount: session.amount_total || 0,
                currency: session.currency || 'xof',
                provider: 'stripe',
                providerRef: session.id,
                metadata: session,
                receiptUrl: receiptUrl || undefined
            });
        }
    }

    return NextResponse.json({ received: true });
}

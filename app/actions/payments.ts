'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getPaymentConfig(packType: 'essentiel' | 'expert' | 'master', amount: number) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Vous devez être connecté.");

    // 1. Transaction ID (Must be unique and ALPHANUMERIC ONLY)
    // Old: P_{USER_ID}_{PACK}_{TIMESTAMP} (Invalid due to underscores)
    // New: P{TIMESTAMP}{USERID_clean}
    const timestamp = Date.now();
    const cleanUserId = user.id.replace(/-/g, '').substring(0, 10);
    const cleanPack = packType.substring(0, 3).toUpperCase();
    const transactionId = `P${timestamp}${cleanUserId}${cleanPack}`;

    // 2. Base URL (for Webhook)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 3. Credentials & Mode
    // User requested NEXT_PUBLIC prefix visibility check, but we read from server env.
    // We will support both for flexibility as user might have renamed them in .env.local
    const apiKey = process.env.CINETPAY_API_KEY || process.env.NEXT_PUBLIC_CINETPAY_API_KEY || '';
    const siteId = process.env.NEXT_PUBLIC_CINETPAY_SITE_ID || '';
    const modeEnv = process.env.CINETPAY_MODE || 'PRODUCTION';

    // Logic: Force TEST if mode is explicitly TEST or if likely a test key
    let mode = modeEnv;
    if (apiKey.startsWith('test_') || modeEnv === 'TEST') {
        mode = 'TEST';
    }

    console.log("----------------------------------------------------");
    console.log("[CinetPay] Generating Config");
    console.log(`[CinetPay] Site ID: '${siteId}'`);
    console.log(`[CinetPay] API Key loaded: ${apiKey ? 'YES (Length: ' + apiKey.length + ')' : 'NO'}`);
    console.log(`[CinetPay] Mode: ${mode}`);
    console.log("----------------------------------------------------");

    if (!apiKey || !siteId) {
        console.error("[CinetPay] CRITICAL: Missing Credentials.");
    }

    // 4. Metadata (For Webhook verification mostly)

    // 5. Construct Payload for Client SDK
    return {
        success: true,
        config: {
            apikey: apiKey,
            site_id: siteId,
            notify_url: `${baseUrl}/api/webhooks/cinetpay`,
            mode: mode,
            transaction_id: transactionId,
            amount: amount,
            currency: 'XOF',
            channels: 'ALL',
            description: `Achat Pack ${packType.toUpperCase()}`,
            // Customer Info - Strict mapping
            customer_name: user.user_metadata?.full_name || 'Eleve',
            customer_surname: 'Adjara',
            customer_email: user.email || 'guigui@test.com', // Fallback for test
            customer_phone_number: "00000000",
            customer_address: "BP 0000",
            customer_city: "Lome",
            customer_country: "TG",
            customer_state: "TG",
            customer_zip_code: "0000",
            metadata: JSON.stringify({ userId: user.id, packType })
        }
    };
}

export async function getMissionPaymentConfig(projectId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Vous devez être connecté.");

    // Fetch Project for Price
    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project || !project.final_price) return { success: false, error: "Projet ou prix invalide." };

    // Transaction ID
    const timestamp = Date.now();
    const cleanUserId = user.id.replace(/-/g, '').substring(0, 10);
    const transactionId = `M${timestamp}${cleanUserId}`; // M for Mission

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const apiKey = process.env.CINETPAY_API_KEY || process.env.NEXT_PUBLIC_CINETPAY_API_KEY || '';
    const siteId = process.env.NEXT_PUBLIC_CINETPAY_SITE_ID || '';
    const modeEnv = process.env.CINETPAY_MODE || 'PRODUCTION';

    let mode = modeEnv;
    if (apiKey.startsWith('test_') || modeEnv === 'TEST') {
        mode = 'TEST';
    }

    return {
        success: true,
        config: {
            apikey: apiKey,
            site_id: siteId,
            notify_url: `${baseUrl}/api/webhooks/cinetpay`,
            mode: mode,
            transaction_id: transactionId,
            amount: project.final_price,
            currency: 'XOF',
            channels: 'ALL',
            description: `Mission: ${project.title.substring(0, 30)}...`,
            customer_name: user.user_metadata?.full_name || 'Client',
            customer_surname: 'AntyG',
            customer_email: user.email,
            customer_phone_number: "00000000",
            customer_address: "Lome",
            customer_city: "Lome",
            customer_country: "TG",
            customer_state: "TG",
            customer_zip_code: "0000",
            metadata: JSON.stringify({ userId: user.id, projectId: projectId }) // CRITICAL: projectId in metadata
        }
    };
}

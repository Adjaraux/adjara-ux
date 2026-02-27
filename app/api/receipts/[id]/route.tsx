import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/utils/supabase-admin';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const transactionId = (await params).id;
    const admin = getAdminClient();

    try {
        // 1. Fetch Transaction & Agency Settings in Parallel (Waterfall reduction)
        const [{ data: tx, error: txError }, { data: agency }] = await Promise.all([
            admin.from('agency_transactions').select('*').eq('id', transactionId).single(),
            admin.from('agency_settings').select('*').single()
        ]);

        if (txError || !tx) {
            return NextResponse.json({ success: false, message: "Transaction introuvable" }, { status: 404 });
        }

        // 2. Fetch Profile and Project in Parallel
        const [profileRes, projectRes] = await Promise.all([
            admin.from('profiles').select('email, full_name').eq('id', tx.user_id).single(),
            tx.project_id
                ? admin.from('projects').select('title').eq('id', tx.project_id).single()
                : Promise.resolve({ data: null })
        ]);

        const profile = profileRes.data;
        const projectTitle = projectRes.data?.title || '';

        const metadata = tx.metadata || {};
        const isMission = tx.project_id !== null;

        const receiptData = {
            id: tx.id,
            date: tx.created_at,
            customerName: profile?.full_name || 'Client',
            customerEmail: profile?.email || '',
            amount: tx.amount,
            currency: tx.currency || 'XOF',
            provider: tx.provider,
            type: (isMission ? 'mission' : 'formation') as 'mission' | 'formation',
            projectName: projectTitle || metadata.projectName,
            packName: metadata.packType || 'Expert',
            description: isMission
                ? `Règlement pour la mission "${projectTitle || 'Agence'}"`
                : `Accès à la formation pack ${metadata.packType?.toUpperCase() || 'EXPERT'}`,
            // Inject Agency Data
            agency: agency || {
                company_name: 'Antygravity Agency',
                address: 'Lomé, Quartier Administratif',
                siret: 'TG-LOM-2024-B-001',
                email_contact: 'contact@antyg.agency'
            }
        };

        return NextResponse.json({ success: true, data: receiptData });

    } catch (e: any) {
        console.error("[Receipts] API Error:", e);
        return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
    }
}

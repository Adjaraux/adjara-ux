
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const dummyId = '11111111-1111-1111-1111-111111111111';

async function diagnose() {
    console.log('Diagnosing UPSERT failure...');

    // 1. Ensure Profile
    await supabase.from('profiles').upsert({ id: dummyId });

    // 2. Base Upsert (ID + Name) - Should work
    const base = { id: dummyId, company_name: "Base Test" };
    const { error: e1 } = await supabase.from('agency_clients').upsert(base);
    console.log('Base Upsert:', e1 ? `FAIL (${e1.message})` : 'OK');

    // 3. Test client_type
    const { error: e2 } = await supabase.from('agency_clients').upsert({ ...base, client_type: 'company' });
    console.log('With client_type:', e2 ? `FAIL (${e2.message})` : 'OK');

    // 4. Test contact_email
    const { error: e3 } = await supabase.from('agency_clients').upsert({ ...base, contact_email: 'test@test.com' });
    console.log('With contact_email:', e3 ? `FAIL (${e3.message})` : 'OK');

    // 5. Test billing_address (JSONB)
    const { error: e4 } = await supabase.from('agency_clients').upsert({ ...base, billing_address: { full_address: "Address" } });
    console.log('With billing_address:', e4 ? `FAIL (${e4.message})` : 'OK');

    // Cleanup
    await supabase.from('agency_clients').delete().eq('id', dummyId);
    await supabase.from('profiles').delete().eq('id', dummyId);
}

diagnose();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('Inspecting agency_clients columns...');

    // We can't query information_schema easily with js client normally restricted, 
    // but we can try to insert a dummy row and catch the error, or select * limit 1 and look at keys.

    const { data, error } = await supabase
        .from('agency_clients')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting from agency_clients:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Existing row keys:', Object.keys(data[0]));
    } else {
        console.log('No rows found. Trying to insert a dummy row to test schema...');
        // We'll rely on the user having run the migration updates.
        // If we can't see columns, we can't verify.
        // Let's try to RPC or just infer.
    }

    // Let's try to update a non-existent ID with all fields to see if it complains about columns
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const payload = {
        id: dummyId,
        company_name: "Test",
        industry: "Test",
        website_url: "http://test.com",
        billing_address: { full_address: "Test Address" },
        client_type: "company",
        contact_email: "test@test.com",
        updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
        .from('agency_clients')
        .upsert(payload);

    if (insertError) {
        console.log('Upsert attempted payload:', payload);
        console.log('Upsert Error:', insertError);
    } else {
        console.log('Upsert successful (shimmed). Schema accepts these columns.');
        // Cleanup
        await supabase.from('agency_clients').delete().eq('id', dummyId);
    }
}

inspectSchema();

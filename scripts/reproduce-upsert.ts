
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function reproduceUpsert() {
    console.log('Attempting UPSERT with Service Role...');

    // Use a random UUID to avoid conflict with real user
    const dummyId = '11111111-1111-1111-1111-111111111111';

    // First ensure profile exists (FK constraint)
    // The profile table might be linked via FK. 
    // If I upsert to agency_clients, and id references profiles(id), I MUST have a profile first.
    // Wait, `agency_clients.id` references `profiles.id`. 
    // If the user doesn't exist in `profiles`, `agency_clients` insert WILL FAIL.
    // BUT the error should say "violates foreign key constraint".

    // Let's ensure dummy profile
    // Note: Profiles usually auto-created on auth.users insert via trigger.
    // But manually we can try insertion if RLS allows or we use Service Role.
    // Service Role bypasses RLS.

    // Check if profile exists; if not insert it.
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: dummyId,
        updated_at: new Date().toISOString()
    });

    if (profileError) {
        console.log("Profile Upsert Check detected error (might be fine if exists):", profileError);
    }

    const payload = {
        id: dummyId,
        company_name: "Test Company",
        industry: "Tech",
        website_url: "https://example.com",
        billing_address: { full_address: "123 Main St" },
        client_type: "company",
        contact_email: "test@example.com",
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('agency_clients')
        .upsert(payload)
        .select();

    if (error) {
        console.log('❌ UPSERT Error:');
        console.log(JSON.stringify(error, null, 2));
        // Also try property names
        console.log('Error Message:', error.message);
        console.log('Error Details:', error.details);
        console.log('Error Hint:', error.hint);
    } else {
        console.log('✅ UPSERT Success!');
        console.log('Data:', data);

        // Cleanup
        await supabase.from('agency_clients').delete().eq('id', dummyId);
        await supabase.from('profiles').delete().eq('id', dummyId);
    }
}

reproduceUpsert();

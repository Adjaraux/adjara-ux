
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkColumns() {
    console.log('Checking specific columns...');

    // Try to select the NEW columns specifically
    const { data, error } = await supabase
        .from('agency_clients')
        .select('id, client_type, contact_email')
        .limit(1);

    if (error) {
        console.error('❌ Column Check Failed:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('✅ Columns exist and are selectable.');
        console.log('Data sample:', data);
    }
}

checkColumns();

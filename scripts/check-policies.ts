
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkPolicies() {
    console.log('Checking Policies...');

    const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .in('tablename', ['profiles', 'agency_clients']);

    if (error) {
        console.log('Error fetching policies:', error);
        return;
    }

    data.forEach(p => {
        console.log(`Table: ${p.tablename} | Policy: ${p.policyname} | Cmd: ${p.cmd} | Roles: ${p.roles}`);
    });
}

checkPolicies();

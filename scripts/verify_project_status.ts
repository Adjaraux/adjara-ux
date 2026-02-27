
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
    'https://sqspoppjcrygpntiegrf.supabase.co',
    'https://sqspoppjcrygpntiegrf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1NTc4NCwiZXhwIjoyMDg1MTMxNzg0fQ.Wd70fE0_UZkWWecelvHRtB4_JIyVclNgGJpJOytEbyE'
);

const projectId = 'ce91debe-7d13-4e4c-a116-29116e0339d6';

async function verify() {
    console.log("🔍 Verifying Project Status...");

    // Check Project
    const { data: project, error: pError } = await sb
        .from('projects')
        .select('id, status, title')
        .eq('id', projectId)
        .single();

    if (pError) console.error("Project Error:", pError);
    else console.log(`Project Status: ${project.status}`);

    // Check Transaction
    const { data: txs, error: tError } = await sb
        .from('agency_transactions')
        .select('*')
        .contains('metadata', { project_id: projectId });

    if (tError) console.error("Tx Error:", tError);
    else {
        console.log(`Transactions Found: ${txs.length}`);
        if (txs.length > 0) {
            console.log(`Tx Amount: ${txs[0].amount} ${txs[0].currency}`);
            console.log(`Tx Provider: ${txs[0].provider}`);
        }
    }
}

verify();

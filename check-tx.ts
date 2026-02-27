
import { getAdminClient } from './utils/supabase-admin';

async function check() {
    const admin = getAdminClient();
    const { data, error } = await admin
        .from('agency_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    console.log("Recent Transactions:");
    data.forEach(tx => {
        console.log(`- ID: ${tx.id}, User: ${tx.user_id}, Amount: ${tx.amount} ${tx.currency}, Created: ${tx.created_at}`);
    });
}

check();

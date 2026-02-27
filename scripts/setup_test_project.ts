import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase URL or Service Role Key in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    console.log("Setting up Test Project...");

    // 1. Create Dummy Client Profile & Agency Client
    const dummyClientId = '00000000-0000-0000-0000-000000000000'; // Or random
    // Actually better to use a real ID format or fetch an existing one.
    // Let's create a stub user in auth.users? No, that's hard.
    // Let's just lookup the first user in 'profiles' and make them the client.

    const { data: users, error: userError } = await supabase.from('profiles').select('id').limit(1);
    if (!users || users.length === 0) {
        console.error("No users found to set as client. Run setup_test_users first and sign up someone.");
        return;
    }
    const clientId = users[0].id;

    // Ensure they are an Agency Client
    await supabase.from('agency_clients').upsert({
        id: clientId,
        company_name: "Test Client Corp",
        industry: "Tech",
        client_type: "company"
    });

    // 2. Insert Project
    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            client_id: clientId,
            title: "Mission Test Automatisé",
            description: "Ceci est une mission de test pour valider le workflow Agence.",
            budget_range: "150k - 300k",
            required_specialty: "design",
            status: "pending_approval",
            specs: { category: "Identité Visuelle", subcategory: "Logo" }
        })
        .select()
        .single();

    if (error) {
        console.error("Project Create Error:", error);
    } else {
        console.log("Project Created:", project.id);
        console.log("Title:", project.title);
    }
}

main();

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
    const action = process.argv[2]; // 'admin' or 'student'
    const email = process.argv[3];

    if (!action || !email) {
        console.log("Usage: npx tsx scripts/setup_test_users.ts <admin|student> <email>");
        process.exit(1);
    }

    console.log(`Setting up ${email} as ${action}...`);

    // 1. Find User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error("List Users Error:", userError);
        process.exit(1);
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`User ${email} not found. Please sign up in the browser first.`);
        process.exit(1);
    }

    console.log(`Found user ${user.id}`);

    // 2. Update Profile Role
    if (action === 'admin') {
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id);

        if (error) console.error("Update Role Error:", error);
        else console.log("Success! Role updated to 'admin'.");

    } else if (action === 'student') {
        // Update role to 'eleve' AND add a certificate
        const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: 'eleve', full_name: 'Student Agent' })
            .eq('id', user.id);

        if (roleError) console.error("Update Role Error:", roleError);

        // Add Certificate
        const { error: certError } = await supabase
            .from('certificates')
            .upsert({
                user_id: user.id,
                specialty: 'design', // Matching the project we will likely use
                issued_at: new Date().toISOString(),
                certificate_id: `CERT-${Date.now()}`
            }, { onConflict: 'certificate_id' }); // Assuming conflict handling or just insert

        if (certError) console.log("Certificate Error (might already exist):", certError.message);
        else console.log("Success! Role updated to 'eleve' and Certificate added.");
    }
}

main();

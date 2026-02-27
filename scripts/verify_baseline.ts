
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyFeatures() {
    console.log("🚀 Starting Baseline Feature Verification...\n");

    // 1. Check Moneroo Integration Code
    console.log("Checking Moneroo Integration...");
    const { data: txs, error: txError } = await supabase.from('agency_transactions').select('id, provider').eq('provider', 'moneroo').limit(1);
    if (txError) {
        console.log("❌ Moneroo Transaction Table Check Failed:", txError.message);
    } else {
        console.log("✅ Moneroo Transaction Table exists and is queryable.");
    }

    // 2. Check Project Tracking Flow
    console.log("\nChecking Project Tracking Flow...");
    const { data: projects, error: pError } = await supabase.from('projects').select('id, status, title').limit(5);
    if (pError) {
        console.log("❌ Projects Table Check Failed:", pError.message);
    } else {
        console.log(`✅ Projects found: ${projects?.length || 0}`);
        projects?.forEach(p => console.log(`   - [${p.status}] ${p.title}`));
    }

    // 3. Check LMS / Academy Features
    console.log("\nChecking LMS / Academy Features...");
    const { data: courses, error: cError } = await supabase.from('courses').select('id, title').limit(5);
    if (cError) {
        console.log("❌ Courses Table Check Failed (LMS logic might be in another table):", cError.message);
    } else {
        console.log(`✅ Courses found: ${courses?.length || 0}`);
    }

    const { data: students, error: sError } = await supabase.from('profiles').select('id, role, full_name').eq('role', 'eleve').limit(5);
    if (sError) {
        console.log("❌ Profiles/Students Check Failed:", sError.message);
    } else {
        console.log(`✅ Students (eleve) found: ${students?.length || 0}`);
    }

    // 4. Check Site Configs (YouTube, etc.)
    console.log("\nChecking Site Configurations...");
    const { data: configs, error: configError } = await supabase.from('site_configs').select('key, value');
    if (configError) {
        console.log("❌ Site Configs Check Failed:", configError.message);
    } else {
        console.log(`✅ Configs found: ${configs?.length || 0}`);
        configs?.forEach(c => console.log(`   - ${c.key}: ${c.value}`));
    }

    console.log("\n--- Verification Finished ---");
}

verifyFeatures().catch(err => {
    console.error("FATAL ERROR during verification:", err);
    process.exit(1);
});

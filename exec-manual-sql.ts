
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing ENV vars");
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    console.log("Initializing Agency Settings Table...");

    // We'll run the SQL by parts if needed, but since we have a single file, 
    // let's try to use the 'pg_query' if available via RPC, 
    // but the most reliable way without RPC is to run it as a series of instructions if they are simple, 
    // or use the 'unsafe' execute if your environment allows.
    // Since I don't have a generic SQL executor RPC, I'll rely on the fact that I can't easily run arbitrary SQL via the JS client without an RPC like 'exec_sql'.

    // Check if table exists
    const { error: checkError } = await supabase.from('agency_settings').select('id').limit(1);

    if (checkError && checkError.code === 'PGRST116') {
        // Table might exist but be empty, that's fine.
    } else if (checkError) {
        console.log("Table seems missing, please run the SQL in the Supabase Dashboard SQL Editor:");
        console.log("File: d:/antygravity/mon-entreprise/supabase/create_agency_settings.sql");
    } else {
        console.log("Table exists.");
    }
}

run();

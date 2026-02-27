
// Use relative path to avoid alias issues
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing ENV vars", { url: !!url, key: !!key });
    process.exit(1);
}

const admin = createClient(url, key);

async function run() {
    try {
        const { data, error, count } = await admin
            .from('agency_settings')
            .select('*', { count: 'exact' });

        if (error) {
            console.error("DB Error:", JSON.stringify(error));
        } else {
            console.log("Count:", count);
            console.log("Data:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fatal Error:", e.message);
    }
}

run();

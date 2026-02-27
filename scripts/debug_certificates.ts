
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Connecting to:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Debugging Certificates Schema ---');

    const { data: sample, error: sampleError } = await supabase
        .from('certificates')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('Error:', JSON.stringify(sampleError, null, 2));
    } else {
        console.log('Success.');
        if (sample && sample.length > 0) {
            const row = sample[0];
            console.log('KEYS FOUND:', JSON.stringify(Object.keys(row), null, 2));
        } else {
            console.log('Table is empty. Cannot deduce keys from data.');
            // Fallback: Try to insert a dummy to see error? No, that's risky.
        }
    }
}

main();

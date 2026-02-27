
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Inspector: agency_clients ---');

    // Check columns via information_schema or just select * limit 1
    const { data, error } = await supabase
        .from('agency_clients')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Keys:', Object.keys(data[0]));
        } else {
            console.log('Table empty. Trying to infer from error on select specific column...');
            const { error: colError } = await supabase.from('agency_clients').select('client_type').limit(1);
            if (colError) {
                console.log('Column client_type likely MISSING:', colError.message);
            } else {
                console.log('Column client_type EXISTS.');
            }
        }
    }
}

main();

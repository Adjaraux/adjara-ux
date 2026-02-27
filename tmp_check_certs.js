
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqspoppjcrygpntiegrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1NTc4NCwiZXhwIjoyMDg1MTMxNzg0fQ.Wd70fE0_UZkWWecelvHRtB4_JIyVclNgGJpJOytEbyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCerts() {
    console.log("--- CHECKING CERTIFICATES TABLE ---");
    const { data, error } = await supabase.from('certificates').select('*').limit(5);
    if (error) {
        console.error("Error fetching certificates:", error);
    } else {
        console.log("Certificates count in DB:", data.length);
        if (data.length > 0) {
            console.log("First certificate sample:", JSON.stringify(data[0], null, 2));
        }
    }

    console.log("\n--- CHECKING JOIN WITH ALIAS 'profile' ---");
    const { data: joinData, error: joinError } = await supabase
        .from('certificates')
        .select(`
            id,
            user_id,
            profile:user_id (id, full_name, email),
            courses:course_id (title)
        `)
        .limit(5);

    if (joinError) {
        console.error("Join error with 'profile':", joinError);

        console.log("\n--- TRYING JOIN WITH ALIAS 'profiles' ---");
        const { data: joinData2, error: joinError2 } = await supabase
            .from('certificates')
            .select(`
                id,
                user_id,
                profiles:user_id (id, full_name, email),
                courses:course_id (title)
            `)
            .limit(5);

        if (joinError2) {
            console.error("Join error with 'profiles':", joinError2);
        } else {
            console.log("Join with 'profiles' worked! Sample:", JSON.stringify(joinData2[0], null, 2));
        }
    } else {
        console.log("Join with 'profile' worked! Sample:", JSON.stringify(joinData[0], null, 2));
    }
}

checkCerts();

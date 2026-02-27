
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqspoppjcrygpntiegrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1NTc4NCwiZXhwIjoyMDg1MTMxNzg0fQ.Wd70fE0_UZkWWecelvHRtB4_JIyVclNgGJpJOytEbyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuizAttempts() {
    console.log("--- 1. Simple fetch from quiz_attempts ---");
    const { data, error } = await supabase.from('quiz_attempts').select('*').limit(5);
    if (error) {
        console.error("Fetch error:", error);
    } else {
        console.log(`Found ${data.length} attempts.`);
        if (data.length > 0) {
            console.log("Sample:", JSON.stringify(data[0], null, 2));
        }
    }

    console.log("\n--- 2. Testing JOIN logic (profile:user_id) ---");
    const { data: joinData, error: joinError } = await supabase
        .from('quiz_attempts')
        .select(`
            id,
            user_id,
            profile:user_id (id, full_name, email),
            lessons:lesson_id (title)
        `)
        .limit(5);

    if (joinError) {
        console.error("Join error (profile):", joinError);
    } else {
        console.log("Join success!", joinData[0]);
    }

    console.log("\n--- 3. Testing JOIN logic (users:user_id) ---");
    const { data: joinData2, error: joinError2 } = await supabase
        .from('quiz_attempts')
        .select(`
            id,
            user_id,
            users:user_id (id, email),
            lessons:lesson_id (title)
        `)
        .limit(5);

    if (joinError2) {
        console.error("Join error (users):", joinError2);
    } else {
        console.log("Join (users) success!", joinData2[0]);
    }
}

checkQuizAttempts();

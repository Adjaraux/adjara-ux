
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqspoppjcrygpntiegrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1NTc4NCwiZXhwIjoyMDg1MTMxNzg0fQ.Wd70fE0_UZkWWecelvHRtB4_JIyVclNgGJpJOytEbyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAudit() {
    console.log("--- 1. Raw quiz_attempts count ---");
    const { count, error: cError } = await supabase.from('quiz_attempts').select('*', { count: 'exact', head: true });
    console.log("Total rows in quiz_attempts:", count, cError || "");

    console.log("\n--- 2. Fetching first attempt and checking lesson_id ---");
    const { data: firstAttempts } = await supabase.from('quiz_attempts').select('*').limit(1);
    if (firstAttempts && firstAttempts.length > 0) {
        const attempt = firstAttempts[0];
        console.log("Attempt lesson_id:", attempt.lesson_id);

        const { data: lesson } = await supabase.from('lessons').select('*').eq('id', attempt.lesson_id).single();
        console.log("Lesson found:", lesson ? lesson.title : "NOT FOUND");
    }

    console.log("\n--- 3. Testing getAdminAttempts Join (Public Schema) ---");
    const { data: testJoin, error: jError } = await supabase
        .from('quiz_attempts')
        .select(`
            *,
            lessons(title)
        `)
        .limit(5);

    if (jError) {
        console.error("Join lessons Error:", jError);
    } else {
        console.log("Join lessons Success!", testJoin.length, "rows returned.");
        if (testJoin.length > 0) {
            console.log("Sample lesson title:", testJoin[0].lessons?.title);
        }
    }

    console.log("\n--- 4. Checking if relation is named 'lesson' instead of 'lessons' ---");
    const { data: testJoin2, error: jError2 } = await supabase
        .from('quiz_attempts')
        .select(`
            *,
            lesson:lesson_id (title)
        `)
        .limit(5);

    if (jError2) {
        console.error("Join lesson alias Error:", jError2);
    } else {
        console.log("Join lesson alias Success!");
    }
}

deepAudit();

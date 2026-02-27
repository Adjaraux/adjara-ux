
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqspoppjcrygpntiegrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1NTc4NCwiZXhwIjoyMDg1MTMxNzg0fQ.Wd70fE0_UZkWWecelvHRtB4_JIyVclNgGJpJOytEbyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGenerate() {
    // 1. Find a user with some progress
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').limit(5);
    if (!profiles || profiles.length === 0) {
        console.log("No profiles found.");
        return;
    }

    const testUser = profiles[0];
    console.log("Testing with user:", testUser.full_name, testUser.id);

    // 2. Find a course
    const { data: courses } = await supabase.from('courses').select('id, title, slug').limit(1);
    if (!courses || courses.length === 0) {
        console.log("No courses found.");
        return;
    }
    const testCourse = courses[0];

    // 3. Try to insert directly into certificates as a test
    console.log("Attempting test insertion into certificates...");
    const { data: insData, error: insError } = await supabase.from('certificates').insert({
        user_id: testUser.id,
        course_id: testCourse.id,
        final_grade: 18.5,
        storage_path: 'test/path.pdf',
        metadata: { certificate_id: 'TEST-123' }
    }).select();

    if (insError) {
        console.error("Insertion failed:", insError);
    } else {
        console.log("Insertion successful!", insData);

        // 4. Cleanup
        await supabase.from('certificates').delete().eq('id', insData[0].id);
        console.log("Test record cleaned up.");
    }
}

testGenerate();

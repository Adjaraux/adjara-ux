
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqspoppjcrygpntiegrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1NTc4NCwiZXhwIjoyMDg1MTMxNzg0fQ.Wd70fE0_UZkWWecelvHRtB4_JIyVclNgGJpJOytEbyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
    console.log("--- Verifying Manual Profile Fetch Logic ---");
    const { data: rawAttempts, error: rawError } = await supabase
        .from('quiz_attempts')
        .select(`*, lessons:lesson_id (title)`)
        .order('started_at', { ascending: false })
        .limit(5);

    if (rawError) {
        console.error("Raw Fetch Error:", rawError);
        return;
    }

    const userIds = Array.from(new Set(rawAttempts.map(a => a.user_id)));
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').in('id', userIds);

    const mapped = rawAttempts.map(a => {
        const p = profiles?.find(prof => prof.id === a.user_id);
        return {
            id: a.id,
            user_email: p?.email || 'Inconnu',
            user_name: p?.full_name || 'Sans Nom',
            lesson_title: a.lessons?.title || 'Leçon Supprimée'
        };
    });

    console.log("Mapped results:", JSON.stringify(mapped, null, 2));
}

verifyFix();

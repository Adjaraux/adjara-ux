
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
    'https://sqspoppjcrygpntiegrf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTU3ODQsImV4cCI6MjA4NTEzMTc4NH0.ZdX7jJRiTxeTVPdcOxwTZC4KW263KcM5QkXD7oYPQfw'
);

async function run() {
    console.log("Fetching pending project...");
    const { data, error } = await sb
        .from('projects')
        .select('id, client_id, title')
        .eq('status', 'pending_approval')
        .limit(1)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("PROJECT_ID=" + data.id);
        console.log("CLIENT_ID=" + data.client_id);
    }
}

run();

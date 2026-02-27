
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqspoppjcrygpntiegrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc3BvcHBqY3J5Z3BudGllZ3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1NTc4NCwiZXhwIjoyMDg1MTMxNzg0fQ.Wd70fE0_UZkWWecelvHRtB4_JIyVclNgGJpJOytEbyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('certificates').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log("Columns found:", Object.keys(data[0] || {}));
    }
}
checkColumns();

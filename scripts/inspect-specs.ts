
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSpecs() {
    console.log('Fetching latest project specs...');

    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, specs, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('No projects found.');
        return;
    }

    const project = projects[0];
    console.log(`\nProject: ${project.title} (${project.id})`);
    console.log('Specs Payload:', JSON.stringify(project.specs, null, 2));

    // Check structure
    if (!project.specs) {
        console.log('❌ Specs is NULL or undefined');
    } else if (Object.keys(project.specs).length === 0) {
        console.log('⚠️ Specs object is EMPTY');
    } else {
        console.log('✅ Specs object has keys:', Object.keys(project.specs));

        // Check for category/subcategory used in SpecsViewer
        console.log('Category:', project.specs.category);
        console.log('Subcategory:', project.specs.subcategory);
    }
}

inspectSpecs();

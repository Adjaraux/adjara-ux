
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
    const email = 'test-student-loop@adjara.com';
    const password = 'Password123!';

    // 1. Get Tronc Commun Course IDs
    const { data: tcCourses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('category', 'tronc_commun');

    console.log("Tronc Commun Courses:", tcCourses);

    // 2. Create User
    console.log(`Creating user ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Test Student Loop' }
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log("User already exists, continuing...");
        } else {
            console.error("Auth Error:", authError);
            return;
        }
    }

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        console.error("User not found after creation");
        return;
    }
    const userId = user.id;
    console.log("User ID:", userId);

    // 3. Update Profile
    console.log("Updating profile...");
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'eleve',
            pack_type: 'essentiel',
            subscription_start: new Date().toISOString(),
            specialty: 'none'
        })
        .eq('id', userId);

    if (profileError) {
        console.error("Profile Error:", profileError);
        return;
    }

    // 4. Mock Progress
    console.log("Mocking Tronc Commun progress...");
    for (const course of tcCourses!) {
        const { error: progError } = await supabase
            .from('user_progress')
            .upsert({
                user_id: userId,
                course_id: course.id,
                progress_percent: 100,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,course_id' });

        if (progError) console.error(`Error for course ${course.title}:`, progError);
    }

    console.log("Setup complete. Test user is ready for loop reproduction.");
}

debug();

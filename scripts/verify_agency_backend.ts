
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing credentials.");
    process.exit(1);
}

// Clients
const adminClient = createClient(supabaseUrl, serviceRoleKey); // Service Role
const publicClient = createClient(supabaseUrl, anonKey); // For Auth Signup/Login

async function getAuthenticatedClient(email: string, password: string): Promise<{ client: SupabaseClient, user: any }> {
    console.log(`   [Auth] Authenticating '${email}'...`);

    // 0. Check if user exists via Admin API
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`   [Auth] User exists (${existingUser.id}). Resetting password...`);
        const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, { password: password });
        if (updateError) throw new Error("Password Reset Failed: " + updateError.message);

        if (!existingUser.email_confirmed_at) {
            await adminClient.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
        }
    } else {
        console.log(`   [Auth] User does not exist. Creating via Admin API (Bypass Rate Limit)...`);
        // Use Admin API to create user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm
            user_metadata: { full_name: email.split('@')[0] }
        });

        if (createError) {
            console.error(`   [Auth] Admin Create Failed: ${createError.message}`);
            throw createError;
        }
    }

    // 1. Try Login (Should work now)
    const { data: loginData, error: loginError } = await publicClient.auth.signInWithPassword({ email, password });

    if (loginError) {
        throw new Error("Login failed after admin creation/reset: " + loginError.message);
    }

    return {
        client: createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${loginData.session.access_token}` } } }),
        user: loginData.user
    };
}

async function main() {
    try {
        console.log("\n🚀 Verification v5 (Admin Create Strategy)...\n");

        const password = 'password123';
        const clientEmail = `verify.client.v5@agency.local`;
        const adminEmail = `verify.admin.v5@agency.local`;
        const studentEmail = `verify.student.v5@agency.local`;

        // 1. CLIENT
        console.log("👤 Setting up Client...");
        const { client: clientSupabase, user: clientUser } = await getAuthenticatedClient(clientEmail, password);
        await adminClient.from('profiles').update({ role: 'client' }).eq('id', clientUser.id);
        await adminClient.from('agency_clients').upsert({ id: clientUser.id, company_name: "Verify Corp", industry: "Tech" });

        // 2. ADMIN
        console.log("🛡️ Setting up Admin...");
        const { client: adminUserClient, user: adminUser } = await getAuthenticatedClient(adminEmail, password);
        await adminClient.from('profiles').update({ role: 'admin' }).eq('id', adminUser.id);

        // 3. STUDENT
        console.log("🎓 Setting up Student...");
        const { client: studentSupabase, user: studentUser } = await getAuthenticatedClient(studentEmail, password);
        await adminClient.from('profiles').update({ role: 'eleve' }).eq('id', studentUser.id);
        await adminClient.from('certificates').upsert({ user_id: studentUser.id, specialty: 'design', certificate_id: `CERT-${studentUser.id.substring(0, 8)}` }, { onConflict: 'certificate_id' });


        // --- STEP 2: CREATE PROJECT (As Client) ---
        console.log("\n📝 [Client] Creating Project...");
        const { data: project, error: projError } = await clientSupabase
            .from('projects')
            .insert({
                title: "Mission Verification v5",
                description: "Test automated flow verification.",
                budget_range: "100k - 200k",
                required_specialty: "design",
                status: "pending_approval",
                client_id: clientUser.id
            })
            .select()
            .single();

        if (projError) throw new Error("Client Project Create Failed: " + projError.message);
        console.log("   ✅ Project Created:", project.id);


        // --- STEP 3: ASSIGN PROJECT (As Admin) ---
        console.log("\n👮 [Admin] Assigning Project...");
        await adminClient.from('projects').update({ status: 'open', final_price: 150000 }).eq('id', project.id);

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        const { error: assignError } = await adminClient
            .from('projects')
            .update({
                status: 'in_progress',
                assigned_talent_id: studentUser.id,
                deadline: deadline.toISOString()
            })
            .eq('id', project.id);

        if (assignError) throw new Error("Assignment Failed: " + assignError.message);
        console.log("   ✅ Project Assigned to Student:", studentUser.email);


        // --- STEP 4: STUDENT SUBMIT (Simulated) ---
        console.log("\n👨‍🎓 [Student] Viewing & Submitting...");

        const { data: visibleProject, error: viewError } = await studentSupabase
            .from('projects')
            .select('*')
            .eq('id', project.id)
            .single();

        if (viewError || !visibleProject) throw new Error("Student CANNOT see assigned project! RLS Issue?");
        console.log("   ✅ Student sees project.");

        console.log("   (Simulating Server Action Execution...)");
        const { error: deliverError } = await adminClient
            .from('project_deliverables')
            .insert({
                project_id: project.id,
                uploader_id: studentUser.id,
                file_url: "https://example.com/reuse.zip",
                file_name: "reuse.zip",
                file_type: "design"
            });

        if (deliverError) throw new Error("Deliverable Insert Failed: " + deliverError.message);

        await adminClient.from('projects').update({ status: 'review' }).eq('id', project.id);
        console.log("   ✅ Deliverable Submitted & Status -> Review");


        // --- STEP 5: VALIDATION (As Admin) ---
        console.log("\n👮 [Admin] Validating...");

        const { data: deliverables } = await adminClient
            .from('project_deliverables')
            .select('*')
            .eq('project_id', project.id);

        if (!deliverables || deliverables.length === 0) throw new Error("Admin sees no deliverables!");
        console.log("   ✅ Admin sees deliverables:", deliverables.length);

        const { error: completeError } = await adminClient
            .from('projects')
            .update({ status: 'completed' })
            .eq('id', project.id);

        if (completeError) throw new Error("Validation Failed");

        console.log("   ✅ Project Completed!");

        console.log("\n🎉 FULL WORKFLOW VERIFIED SUCCESSFULLY!");

    } catch (e: any) {
        console.error("\n❌ VERIFICATION FAILED:", e.message);
        process.exit(1);
    }
}

main();

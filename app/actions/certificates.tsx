'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';


async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );
}

// Helper to confirm admin privileges/service key
function getAdminClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Server configuration error: Missing Service Key");

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );
}

export async function generateCertificate(courseId: string, courseSlug: string) {
    const supabaseUser = await getSupabase();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const admin = getAdminClient();

    // 1. Check existing certificate
    const { data: existing } = await admin
        .from('certificates')
        .select('id, storage_path, final_grade')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    // If exists, verify validity
    if (existing) {
        // Check if file accessible/signable
        const { data: signed, error: signError } = await admin
            .storage
            .from('certificates')
            .createSignedUrl(existing.storage_path, 3600); // 1 hour link

        if (signed?.signedUrl) {
            return {
                url: signed.signedUrl,
                grade: existing.final_grade,
                isNew: false
            };
        } else {
            // Zombie record found (Record exists, but File missing or error).
            // Delete it and allow regeneration.
            await admin.from('certificates').delete().eq('id', existing.id);
        }
    }

    // 2. Fetch Course Details & Threshold
    const { data: course } = await admin
        .from('courses')
        .select('title, min_score_to_certify')
        .eq('id', courseId)
        .single();

    if (!course) throw new Error("Course not found");

    // 3. Calculate Grade
    const { data: gradeData, error: gradeError } = await admin.rpc('get_student_grade', {
        p_course_id: courseId,
        p_user_id: user.id
    });

    if (gradeError || !gradeData) throw new Error("Failed to calculate grade");

    const grade20 = parseFloat(gradeData.grade_20); // x/20
    let threshold = course.min_score_to_certify || 16; // Default to 16/20 (80%)

    // Safety: If threshold seems to be percentage (e.g. 80), normalize it to /20
    if (threshold > 20) {
        threshold = threshold / 5;
    }

    if (grade20 < threshold) {
        throw new Error(`Grade insufficient (${grade20}/20). Minimum required: ${threshold}/20.`);
    }

    // Fetch User Profile Name (Robust Check)
    const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single();
    const studentName = (profile?.full_name || user.user_metadata?.full_name || user.email || 'Étudiant').trim();

    if (!studentName) throw new Error("Profile name missing"); // Should never happen with fallback

    // 4. PREPARE DATA & PERSIST RECORD
    const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const issuedAt = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    // We'll store a placeholder or specialized path since the file is generated client-side first.
    // Ideally, the client should upload it back, but for now we mark it as "client-generated".
    const storagePath = `client_generated/${user.id}/${courseSlug}-certificate.pdf`;

    const { error: dbError } = await admin
        .from('certificates')
        .insert({
            user_id: user.id,
            course_id: courseId,
            final_grade: grade20,
            storage_path: storagePath,
            metadata: {
                certificate_id: certificateId,
                generated_at: new Date().toISOString(),
                student_name_snapshot: studentName,
                instructor_name: "Équipe Pédagogique", // Stored for consistency
                issued_at_display: issuedAt
            }
        });

    if (dbError) {
        console.error("DB Insert Failed:", dbError);
        throw new Error("Failed to record certification in database.");
    }

    // NEW: Fetch Dynamic Settings to inject into the PDF
    const { getCertificateSettings } = await import('./settings');
    const settings = await getCertificateSettings();

    // Return pure JSON data for the client to render the PDF
    return {
        success: true,
        data: {
            studentName,
            courseName: course.title,
            issuedAt,
            certificateId,
            finalGrade: `${grade20.toFixed(1)}/20`,
            instructorName: "Équipe Pédagogique"
        },
        settings // Injecting value from DB
    };
}

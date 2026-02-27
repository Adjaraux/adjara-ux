import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const report: any = {
        timestamp: new Date().toISOString(),
        env: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
        },
        checks: {},
        data: {}
    };

    try {
        // 1. Check Service Role Client
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing from server environment.');
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Check Storage Permissions (List Buckets)
        const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
        report.checks.listBuckets = bucketError ? `ERROR: ${bucketError.message}` : `OK (${buckets?.length} buckets)`;
        report.data.buckets = buckets;

        // 3. Check Academy Bucket Content
        const { data: files, error: fileError } = await supabaseAdmin
            .storage
            .from('academy_content')
            .list('courses', { limit: 10, offset: 0, sortBy: { column: 'name', order: 'asc' } });

        report.checks.listAcademyFiles = fileError
            ? `ERROR: ${fileError.message}`
            : `OK (Found ${files?.length} items in root of courses/)`;

        // 4. Test Signing a URL (Mock)
        const { data: signed, error: signError } = await supabaseAdmin
            .storage
            .from('academy_content')
            .createSignedUrl('courses/test/debug.jpg', 60);

        report.checks.signUrlTest = signError
            ? `ERROR: ${signError.message}`
            : `OK (Generated: ${signed?.signedUrl?.substring(0, 50)}...)`;

        // 5. Check Database Courses
        const { data: courses, error: dbError } = await supabaseAdmin
            .from('courses')
            .select('id, title, thumbnail_url');

        report.data.courses = dbError ? `ERROR: ${dbError.message}` : courses;

    } catch (err: any) {
        report.fatalError = err.message;
    }

    return NextResponse.json(report, { status: 200 });
}

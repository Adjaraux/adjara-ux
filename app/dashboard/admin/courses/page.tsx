import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CourseList } from '@/components/admin/course-list';

export default async function CoursesAdminPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll() { },
            },
        }
    );

    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .order('category')
        .order('unlock_at_month');

    return (
        <CourseList initialCourses={courses || []} />
    );
}

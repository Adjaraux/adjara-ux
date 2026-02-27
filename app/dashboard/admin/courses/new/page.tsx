import { CourseEditor } from '@/components/admin/course-editor';
import { Suspense } from 'react';

export default function NewCoursePage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <CourseEditor />
        </Suspense>
    );
}

import { CourseEditor } from '@/components/admin/course-editor';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: PageProps) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <CourseEditor courseId={id} />
        </div>
    );
}

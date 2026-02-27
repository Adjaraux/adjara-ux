import { getAcademyData } from '@/app/actions/academy';
import { LearningClient } from '@/components/dashboard/learning-client';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LearningPage() {
    const data = await getAcademyData();

    if (!data.success) {
        if (data.error === "Unauthorized") {
            redirect('/login');
        }
        return <div className="p-8 text-center text-red-500">Erreur: {data.error}</div>;
    }

    return (
        <LearningClient
            courses={data.courses || []}
            profile={data.profile}
            monthsSinceSub={data.monthsSinceSub || 0}
            isLateOnTc={!!data.isLateOnTc}
            needsSpecialtySelection={!!data.needsSpecialtySelection}
            needsSubscription={!!data.needsSubscription}
        />
    );
}

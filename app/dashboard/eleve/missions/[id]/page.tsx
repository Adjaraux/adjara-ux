import { getStudentMissionDetails } from '@/app/actions/agency-student';
import { MissionViewClient } from '@/components/agency/mission-view-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function MissionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // 1. Fetch Sanitized Data via Airlock (Server Action)
    const { success, mission, error } = await getStudentMissionDetails(id);

    // 2. Handle Errors (Security or Not Found)
    if (!success || !mission) {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Accès Refusé</AlertTitle>
                    <AlertDescription>
                        {error || "Vous n'avez pas accès à cette mission."}
                    </AlertDescription>
                </Alert>
                <Link href="/dashboard/eleve/missions">
                    <Button variant="outline">Retour aux missions</Button>
                </Link>
            </div>
        );
    }

    // 3. Render Secure View
    return <MissionViewClient mission={mission} />;
}

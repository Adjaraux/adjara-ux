import { getAdminInscriptions } from '@/app/actions/admin-inscriptions';
import { InscriptionsClient } from '@/components/admin/inscriptions-client';
import Link from 'next/link';

export default async function AdminInscriptionsPage() {
    const res = await getAdminInscriptions();
    const inscriptions = res.success ? res.data : [];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Link href="/dashboard/admin" className="hover:text-indigo-600 transition-colors">Admin</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">Demandes de Contact</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Demandes de Contact</h1>
                    <p className="text-slate-500">Gérez les prospects et les inscriptions à l'académie.</p>
                </div>
            </div>

            <InscriptionsClient initialData={inscriptions || []} />
        </div>
    );
}

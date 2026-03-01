import { getAdminClient } from '@/utils/supabase-admin';
import { ProjectReviewModal } from '@/components/admin/project-review-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    LayoutDashboard,
    AlertCircle,
    CheckCircle,
    Clock,
    Archive,
    Wallet,
    Search,
    FileText,
    TrendingUp,
    Download
} from 'lucide-react';
import { DownloadReceiptButton } from '@/components/client/download-receipt-button';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function AdminAgencyDashboard() {
    // 1. Fetch ALL Projects via Service Role (Admin sees all)
    const adminClient = getAdminClient();

    // We need projects + client info
    const { data: projects, error } = await adminClient
        .from('projects')
        .select(`
            *,
            client:profiles!client_id (
                email,
                phone,
                avatar_url,
                agency_clients (
                    company_name,
                    industry,
                    website_url,
                    billing_address,
                    client_type,
                    contact_email,
                    phone
                )
            ),
            project_deliverables(*)
        `)
        .order('created_at', { ascending: false });

    // 2. Fetch Finance Ledger (All success transactions)
    const { data: transactions } = await adminClient
        .from('agency_transactions')
        .select(`
            *,
            profiles (full_name, email),
            projects (title)
        `)
        .eq('status', 'success')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Admin Fetch Error Full Warning:", JSON.stringify(error, null, 2));
        // Check if env is issue
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");
        return <div className="p-8 text-red-500">Erreur de chargement des projets. (Voir logs serveur)</div>;
    }

    // 2. Client-side filtering logic (simplification for v1)
    // We categorize projects into tabs
    const pending = projects.filter((p: any) => p.status === 'pending_approval');
    const reviews = projects.filter((p: any) => p.status === 'review'); // New Tab
    const open = projects.filter((p: any) => p.status === 'open');
    const inProgress = projects.filter((p: any) => p.status === 'in_progress');
    const others = projects.filter((p: any) => ['completed', 'cancelled', 'draft'].includes(p.status));

    // Calculate Stats
    const totalPotential = pending.reduce((acc: number, curr: any) => {
        // Parse budget range for fun or just count
        return acc + 1; // Count for now
    }, 0);

    const ProjectList = ({ list }: { list: any[] }) => {
        if (!list || list.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Archive className="w-12 h-12 mb-4 opacity-20" />
                    <p>Aucun projet dans cette catégorie.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {list.map(project => {
                    // Helper to safely access company name
                    // Structure: project.client (single object) -> agency_clients (array or single object?)
                    // Since agency_clients is 1:1 with profiles (PK references id), profiles->agency_clients might be array or object depending on Postgrest.
                    // Usually reverse relation is Many-to-One so it returns array unless specified.
                    // But agency_clients PK Is the FK. One-to-One.
                    // Supabase JS often returns array for reverse relation unless .single() is impossible here.
                    // We'll check both.
                    const clientProfile = project.client;
                    const agencyData = Array.isArray(clientProfile?.agency_clients)
                        ? clientProfile.agency_clients[0]
                        : clientProfile?.agency_clients;

                    const companyName = agencyData?.company_name || 'Client Inconnu';
                    const clientType = agencyData?.client_type === 'individual' ? 'Particulier' : 'Entreprise';
                    const clientPhone = clientProfile?.phone || agencyData?.phone; // Priority: Profiles (New) > Agency Clients (Old)
                    const clientEmail = agencyData?.contact_email || clientProfile?.email;
                    const clientWebsite = agencyData?.website_url;
                    const clientAddress = agencyData?.billing_address?.full_address;

                    return (
                        <Card key={project.id} className="hover:bg-slate-50 transition-colors group">
                            <CardContent className="p-4 flex items-center gap-4">
                                {/* Icon / Status */}
                                <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                ${project.status === 'pending_approval' ? 'bg-amber-100 text-amber-600' :
                                        project.status === 'open' ? 'bg-green-100 text-green-600' :
                                            'bg-slate-100 text-slate-500'}
                            `}>
                                    {project.status === 'pending_approval' ? <AlertCircle className="w-5 h-5" /> :
                                        project.status === 'open' ? <CheckCircle className="w-5 h-5" /> :
                                            <Clock className="w-5 h-5" />}
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-slate-900 truncate">{project.title}</h4>
                                        <Badge variant="outline" className="text-xs font-normal text-slate-500">
                                            {project.specs?.category || 'Général'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center text-xs text-slate-500 gap-3">
                                        <span className="font-medium text-slate-700">
                                            {companyName}
                                        </span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr })}</span>
                                        <span>•</span>
                                        <span className={`font-medium ${project.payment_status === 'paid' ? 'text-green-600' : 'text-indigo-600'}`}>
                                            {project.final_price ? `${project.final_price} FCFA` : project.budget_range}
                                        </span>
                                        {project.payment_status === 'paid' && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 transition-none border-green-200 ml-1">
                                                PAYÉ
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                <ProjectReviewModal
                                    project={{
                                        ...project,
                                        agency_clients: {
                                            company_name: companyName,
                                            client_type: clientType, // Converted string
                                            phone: clientPhone,
                                            email: clientEmail,
                                            website_url: clientWebsite,
                                            address: clientAddress,
                                            industry: agencyData?.industry
                                        }
                                    }}
                                    trigger={
                                        <Button size="sm" variant={project.status === 'pending_approval' ? "default" : "outline"}>
                                            {project.status === 'pending_approval' ? 'Review' : 'Détails'}
                                        </Button>
                                    }
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                        Agence Control Center
                    </h1>
                    <p className="text-slate-500">Supervision globale des missions et validations.</p>
                </div>
                <div className="flex gap-4">
                    <Card className="bg-indigo-600 text-white border-none shadow-lg py-2 px-4 flex items-center gap-3">
                        <Wallet className="w-5 h-5" />
                        <div>
                            <div className="text-xs opacity-80 uppercase font-semibold">En Attente</div>
                            <div className="text-xl font-bold">{pending.length}</div>
                        </div>
                    </Card>
                </div>
            </div>

            <Tabs defaultValue={reviews.length > 0 ? "reviews" : "pending"} className="space-y-6">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                        Vérifications ({reviews.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-amber-700">
                        À Valider ({pending.length})
                    </TabsTrigger>
                    <TabsTrigger value="open" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
                        Ouverts ({open.length})
                    </TabsTrigger>
                    <TabsTrigger value="inprogress">
                        En Cours ({inProgress.length})
                    </TabsTrigger>
                    <TabsTrigger value="archives">
                        Archives ({others.length})
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Wallet className="w-4 h-4 mr-2" /> Comptabilité
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 flex gap-2 items-center">
                        <AlertCircle className="w-4 h-4" />
                        Ces missions ont été livrées par les élèves. Vérifiez les livrables avant de clôturer.
                    </div>
                    <ProjectList list={reviews} />
                </TabsContent>

                <TabsContent value="pending" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 flex gap-2 items-center">
                        <AlertCircle className="w-4 h-4" />
                        Ces projets nécessitent votre validation et un chiffrage final avant d'être visibles par les élèves.
                    </div>
                    <ProjectList list={pending} />
                </TabsContent>

                <TabsContent value="open">
                    <ProjectList list={open} />
                </TabsContent>

                <TabsContent value="inprogress">
                    <ProjectList list={inProgress} />
                </TabsContent>

                <TabsContent value="archives">
                    <ProjectList list={others} />
                </TabsContent>

                <TabsContent value="finance">
                    <div className="space-y-6">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-white border-l-4 border-l-green-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Revenu Total</p>
                                            <h4 className="text-2xl font-bold text-slate-900 mt-1">
                                                {(transactions?.reduce((acc: number, t: any) => acc + t.amount, 0) || 0).toLocaleString()} <span className="text-sm">XOF</span>
                                            </h4>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Transaction List */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Ref</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Client</th>
                                                <th className="px-6 py-4">Objet</th>
                                                <th className="px-6 py-4">Montant</th>
                                                <th className="px-6 py-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {transactions?.map((tx: any) => (
                                                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id.substring(0, 8)}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-slate-900">{tx.profiles?.full_name}</div>
                                                        <div className="text-xs text-slate-400">{tx.profiles?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border-indigo-100">
                                                            {tx.project_id ? 'Mission' : 'Formation'}
                                                        </Badge>
                                                        <div className="text-xs text-slate-600 mt-1 truncate max-w-[200px]">
                                                            {tx.projects?.title || `Pack ${tx.metadata?.packType?.toUpperCase()}`}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900">
                                                        {tx.amount.toLocaleString()} XOF
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <DownloadReceiptButton
                                                            transactionId={tx.id}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!transactions || transactions.length === 0) && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                        Aucune transaction enregistrée.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}


import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    Lock,
    Trophy,
    Briefcase,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Helper to format currency
const formatCurrency = (amount: number | null, currency: string = 'XOF') => {
    if (amount === null) return "Sur devis";
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(amount);
};
export const dynamic = 'force-dynamic'; // Prevent caching of mission list
export const revalidate = 0;

export default async function StudentMissionsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Diploma Check (The "Gate")
    const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id);

    if (certError) {
        console.error(`[DiplomaCheck] Error:`, certError.message);
    }

    const hasDiploma = certificates && certificates.length > 0;

    // --- LOCKED STATE (No Diploma) ---
    if (!hasDiploma) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">L'Agence Antygravity</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Le marketplace exclusif où nos meilleurs talents rencontrent des clients premium.
                        Des missions rémunérées, des projets concrets, votre carrière qui décolle.
                    </p>
                </div>

                <Card className="border-2 border-slate-200 shadow-xl overflow-hidden relative">
                    {/* Blur / Lock Overlay */}
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-white p-6 rounded-full shadow-2xl mb-6 ring-4 ring-indigo-50">
                            <Briefcase className="w-12 h-12 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Débloquez votre Potentiel : Accédez aux Missions Rémunérées</h2>
                        <p className="text-slate-600 max-w-md mb-8">
                            Validez votre diplôme pour accéder aux missions professionnelles via l'Agence Antygravity.
                            Transformez votre apprentissage en expérience professionnelle rémunérée.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/dashboard/eleve/learning">
                                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Terminer ma Formation
                                </Button>
                            </Link>
                            <Link href="/dashboard/eleve/diplomas">
                                <Button variant="outline" size="lg">
                                    Voir mes Certifications
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Fake Background Content (Blurred) */}
                    <CardContent className="p-8 opacity-20 pointer-events-none filter blur-sm select-none">
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="border rounded-lg p-6 flex justify-between items-center">
                                    <div className="space-y-2">
                                        <div className="h-6 w-48 bg-slate-300 rounded"></div>
                                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="h-10 w-24 bg-slate-300 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- UNLOCKED STATE (Graduate) ---

    // 3. Fetch Projects (Strictly Assigned ONLY)
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, description, budget_range, final_price, currency, status, created_at, deadline, specs')
        .eq('assigned_talent_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-indigo-600" />
                        Stages & Opportunités
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Accédez à vos missions de stage technique. Relevez les défis, progressez et validez vos compétences.
                    </p>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200 flex gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Profil Certifié
                </Badge>
            </div>

            {/* Projects List */}
            {!projects || projects.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900">Aucune opportunité pour le moment</h3>
                        <p className="text-slate-500 max-w-sm mt-2">
                            L'équipe pédagogique prépare de nouveaux sujets.
                            Revenez bientôt pour découvrir vos prochains défis techniques.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow group cursor-default">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6 justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">
                                                    {project.specs?.category || 'Général'}
                                                </Badge>
                                                <span className="text-xs text-slate-400">
                                                    Publié le {new Date(project.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {project.title}
                                            </h3>
                                        </div>

                                        <p className="text-slate-600 line-clamp-2 text-sm">
                                            {project.description}
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                            {project.specs?.subcategory && (
                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                    <span className="font-medium">Type:</span> {project.specs.subcategory}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between min-w-[200px] border-l border-slate-100 pl-6 gap-6">
                                        <div className="text-right">
                                            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Budget</span>
                                            <div className="text-2xl font-bold text-slate-900">
                                                {formatCurrency(project.final_price, project.currency)}
                                            </div>
                                            {project.final_price === null && (
                                                <span className="text-xs text-amber-600 font-medium">
                                                    Indemnité : {project.budget_range}
                                                </span>
                                            )}
                                        </div>

                                        <Link href={`/dashboard/eleve/missions/${project.id}`} className="w-full">
                                            <Button className="w-full bg-slate-900 hover:bg-indigo-600 text-white transition-colors">
                                                Accéder au Brief <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

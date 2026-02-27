import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { StudentProfileForm } from '@/components/profile/student-profile-form';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Package } from 'lucide-react';

export default async function ProfilePage() {
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Fetch Profile Extra Data (Pack & Specialty) - readonly here
    const { data: profile } = await supabase
        .from('profiles')
        .select('pack_type, specialty')
        .eq('id', user.id)
        .single();

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">Mon Profil 👤</h1>
                <span className="text-sm text-slate-500">Gérez votre identité et vos accès</span>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-900">Pack Actif</CardTitle>
                        <Package className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-700 capitalize">
                            {profile?.pack_type || 'Aucun'}
                        </div>
                        <p className="text-xs text-indigo-600/80 mt-1">Accès complet à la plateforme</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-900">Spécialité</CardTitle>
                        <GraduationCap className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 capitalize">
                            {profile?.specialty && profile.specialty !== 'none' ? profile.specialty : 'À définir'}
                        </div>
                        <p className="text-xs text-emerald-600/80 mt-1">Votre expertise technique</p>
                    </CardContent>
                </Card>
            </div>

            {/* EDITABLE FORM */}
            <StudentProfileForm user={user} />
        </div>
    );
}

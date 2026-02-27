'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, User as UserIcon, Phone, AlertCircle } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function StudentProfileForm({ user }: { user: any }) {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [fetching, setFetching] = useState(true);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, phone, avatar_url')
                .eq('id', user.id)
                .single();

            if (data) {
                setFullName(data.full_name || user.user_metadata?.full_name || '');
                setPhone(data.phone || '');
                setAvatarUrl(data.avatar_url || '');
            }
            setFetching(false);
        };

        fetchProfile();
    }, [user.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: phone,
                    avatar_url: avatarUrl,
                    // We don't update email/role here
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success("Profil mis à jour", {
                description: "Vos informations ont été enregistrées avec succès.",
                className: "bg-emerald-50 border-emerald-200 text-emerald-800"
            });

            router.refresh();

        } catch (error: any) {
            toast.error("Erreur", {
                description: "Impossible de mettre à jour le profil.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Identité & Certificat</CardTitle>
                    <CardDescription>
                        Ces informations seront utilisées pour générer vos certificats officiels.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* AVATAR */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3">
                            <Label className="mb-2 block">Photo de Profil</Label>
                            <ImageUpload
                                folderPath={`${user.id}`}
                                bucketName="avatars"
                                currentPath={avatarUrl}
                                onUploadComplete={(path) => setAvatarUrl(path)}
                            />
                            <p className="text-xs text-slate-500 mt-2">Visible par l'administration et sur votre certificat (optionnel).</p>
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            <div className="space-y-2">
                                <Label htmlFor="fullname">Nom Complet (Pour Diplôme) <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="fullname"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10"
                                        placeholder="Ex: Jean Dupont"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Attention : Modifiez ce champ uniquement si nécessaire. Il apparaîtra tel quel sur vos documents officiels.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-10"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Email (Connexion)</Label>
                                <Input value={user.email} disabled className="bg-slate-50 text-slate-500" />
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Enregistrer les modifications
                </Button>
            </div>
        </form>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Building2, Globe, MapPin, CheckCircle, User, Briefcase } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { updateClientProfileAction } from '@/app/actions/agency'; // Import Action

export default function ClientProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Form Data
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [website, setWebsite] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // NEW FIELDS (Sprint 2.6)
    const [clientType, setClientType] = useState<string>('company'); // 'individual' | 'company'
    const [contactEmail, setContactEmail] = useState('');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Fetch Profiles + Agency Info
            const { data: profile } = await supabase
                .from('profiles')
                .select('phone, avatar_url')
                .eq('id', user.id)
                .single();

            if (profile) {
                setPhone(profile.phone || '');
                setAvatarUrl(profile.avatar_url || '');
            }

            const { data: agencyInfo } = await supabase
                .from('agency_clients')
                .select('*')
                .eq('id', user.id)
                .single();

            if (agencyInfo) {
                setCompanyName(agencyInfo.company_name || '');
                setIndustry(agencyInfo.industry || '');
                setWebsite(agencyInfo.website_url || '');
                setClientType(agencyInfo.client_type || 'company');
                setContactEmail(agencyInfo.contact_email || user.email || '');

                if (typeof agencyInfo.billing_address === 'string') {
                    setAddress(agencyInfo.billing_address);
                } else if (agencyInfo.billing_address && agencyInfo.billing_address.full_address) {
                    setAddress(agencyInfo.billing_address.full_address);
                }
            } else {
                setContactEmail(user.email || '');
            }

            setLoading(false);
        }
        fetchData();
    }, [supabase]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateClientProfileAction({
                company_name: companyName,
                industry,
                website_url: website,
                address,
                phone,
                client_type: clientType as 'individual' | 'company',
                contact_email: contactEmail,
                avatar_url: avatarUrl
            });

            if (result.success) {
                toast.success("Profil mis à jour avec succès !");
            } else {
                toast.error(`Erreur: ${result.message}`);
            }
        } catch (error: any) {
            console.error("Critical Save Error:", error);
            toast.error("Erreur critique lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-8 h-8 text-indigo-600" />
                    Mon Entreprise / Profil
                </h1>
                <p className="text-slate-500 mt-2">
                    Ces informations seront visibles par les talents et utilisées pour la facturation.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Updates */}
                <Card className="md:col-span-2 border-indigo-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Informations Générales</CardTitle>
                        <CardDescription>Détails de votre entité</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Type Selection */}
                        <div className="space-y-3">
                            <Label>Vous êtes ?</Label>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant={clientType === 'company' ? 'default' : 'outline'}
                                    className={`flex-1 ${clientType === 'company' ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:bg-slate-50'}`}
                                    onClick={() => setClientType('company')}
                                >
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Société
                                </Button>
                                <Button
                                    type="button"
                                    variant={clientType === 'individual' ? 'default' : 'outline'}
                                    className={`flex-1 ${clientType === 'individual' ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:bg-slate-50'}`}
                                    onClick={() => setClientType('individual')}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Particulier
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{clientType === 'company' ? "Nom de l'entreprise" : "Nom complet / Raison Sociale"}</Label>
                            <Input
                                placeholder={clientType === 'company' ? "Ex: Studio Digital v2" : "Ex: Jean Dupont"}
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Email de Contact (Facturation & Notifications)</Label>
                            <Input
                                type="email"
                                placeholder="contact@example.com"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Secteur d'activité</Label>
                                <Input
                                    placeholder="Ex: E-commerce, Tech, Santé..."
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Site Web</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        className="pl-9"
                                        placeholder="https://..."
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Téléphone (Contact)</Label>
                            <Input
                                placeholder="+225 ..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Adresse de Facturation</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Textarea
                                    className="pl-9 min-h-[100px]"
                                    placeholder="Adresse complète, Ville, Pays..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]">
                                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                Enregistrer
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Logo & Status */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wide text-slate-500">Logo / Avatar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <div className="w-full">
                                <ImageUpload
                                    bucketName="avatars"
                                    folderPath={userId || 'temp'}
                                    currentPath={avatarUrl}
                                    onUploadComplete={(url: string) => setAvatarUrl(url)}
                                />
                            </div>
                            <p className="text-xs text-center text-slate-400 mt-4">
                                Apparaîtra sur vos projets et factures.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-50 border-indigo-100">
                        <CardContent className="p-4 flex gap-3">
                            <CheckCircle className="h-5 w-5 text-indigo-600 shrink-0" />
                            <div className="text-sm text-indigo-800">
                                <p className="font-semibold mb-1">Compte Vérifié</p>
                                <p className="opacity-80">Votre profil est actif et visible par les talents.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

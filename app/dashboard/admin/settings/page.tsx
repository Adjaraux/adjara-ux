'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import {
    Loader2,
    Youtube,
    Save,
    RefreshCw,
    Play,
    Building2,
    Award,
    Settings2,
    Palette,
    FileText
} from 'lucide-react';
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';
import {
    getAgencySettings,
    updateAgencySettings,
    getCertificateSettings,
    updateCertificateSettings,
    AgencySettings,
    CertificateSettings
} from '@/app/actions/settings';

interface SiteConfig {
    id: string;
    key: string;
    value: string;
    description: string;
}

export default function SettingsPage() {
    // State for Tabs
    const [activeTab, setActiveTab] = useState('general');

    // State for YouTube (Site Configs)
    const [siteConfigs, setSiteConfigs] = useState<SiteConfig[]>([]);
    const [localSiteValues, setLocalSiteValues] = useState<{ [key: string]: string }>({});

    // State for Agency
    const [agencySettings, setAgencySettings] = useState<AgencySettings | null>(null);

    // State for Academy (Certificates)
    const [academySettings, setAcademySettings] = useState<CertificateSettings | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchAllSettings();
    }, []);

    const fetchAllSettings = async () => {
        setIsLoading(true);
        try {
            // Fetch everything in parallel
            const [configsRes, agencyRes, academyRes] = await Promise.all([
                supabase.from('site_configs').select('*').order('key'),
                getAgencySettings(),
                getCertificateSettings()
            ]);

            if (configsRes.data) {
                setSiteConfigs(configsRes.data);
                const values: { [key: string]: string } = {};
                configsRes.data.forEach((c: SiteConfig) => { values[c.key] = c.value; });
                setLocalSiteValues(values);
            }

            setAgencySettings(agencyRes);
            setAcademySettings(academyRes);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Une erreur est survenue lors du chargement des paramètres");
        } finally {
            setIsLoading(false);
        }
    };

    // Save Handlers
    const handleSaveSiteConfig = async (key: string) => {
        setIsSaving(true);
        const value = localSiteValues[key];
        const { error } = await supabase
            .from('site_configs')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);

        if (error) {
            toast.error(`Erreur : ${error.message}`);
        } else {
            toast.success("Vidéo mise à jour");
        }
        setIsSaving(false);
    };

    const handleSaveAgency = async () => {
        if (!agencySettings) return;
        setIsSaving(true);
        const res = await updateAgencySettings(agencySettings);
        if (res.success) {
            toast.success("Informations Agence sauvegardées");
        } else {
            toast.error(res.message || "Erreur lors de la sauvegarde");
        }
        setIsSaving(false);
    };

    const handleSaveAcademy = async () => {
        if (!academySettings) return;
        setIsSaving(true);
        try {
            await updateCertificateSettings(academySettings);
            toast.success("Paramètres Académie mis à jour");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Paramètres Généraux</h1>
                    <p className="text-slate-500 mt-1">Gérez l'identité de l'agence, les médias et l'académie.</p>
                </div>
            </header>

            <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-slate-200/50 p-1 mb-6">
                    <TabsTrigger value="general" className="gap-2">
                        <Building2 className="w-4 h-4" /> Général
                    </TabsTrigger>
                    <TabsTrigger value="media" className="gap-2">
                        <Youtube className="w-4 h-4" /> Médias
                    </TabsTrigger>
                    <TabsTrigger value="academy" className="gap-2">
                        <Award className="w-4 h-4" /> Académie
                    </TabsTrigger>
                </TabsList>

                {/* Tab: General (Agency) */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identité de l'Agence</CardTitle>
                            <CardDescription>Informations légales et de contact utilisées sur les devis et factures.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom de l'entreprise</label>
                                    <Input
                                        value={agencySettings?.company_name || ''}
                                        onChange={(e) => setAgencySettings(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email de contact</label>
                                    <Input
                                        value={agencySettings?.email_contact || ''}
                                        onChange={(e) => setAgencySettings(prev => prev ? { ...prev, email_contact: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SIRET</label>
                                    <Input
                                        value={agencySettings?.siret || ''}
                                        onChange={(e) => setAgencySettings(prev => prev ? { ...prev, siret: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Taux de TVA (%)</label>
                                    <Input
                                        type="number"
                                        value={agencySettings?.vat_rate || 20}
                                        onChange={(e) => setAgencySettings(prev => prev ? { ...prev, vat_rate: parseFloat(e.target.value) } : null)}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Adresse Siège Social</label>
                                    <Textarea
                                        value={agencySettings?.address || ''}
                                        onChange={(e) => setAgencySettings(prev => prev ? { ...prev, address: e.target.value } : null)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveAgency} disabled={isSaving} className="gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Enregistrer l'Identité
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Media (YouTube) */}
                <TabsContent value="media" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vidéos de Présentation</CardTitle>
                            <CardDescription>Gérez les vidéos YouTube affichées sur les pages Académie et Prestations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {siteConfigs.filter(c => c.key.includes('youtube')).map((config) => {
                                const youtubeId = getYouTubeId(localSiteValues[config.key]);
                                const thumbnailUrl = getYouTubeThumbnail(youtubeId);

                                return (
                                    <div key={config.key} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    {config.description}
                                                </label>
                                                <Input
                                                    value={localSiteValues[config.key] || ''}
                                                    placeholder="Lien YouTube"
                                                    onChange={(e) => setLocalSiteValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <Button
                                                onClick={() => handleSaveSiteConfig(config.key)}
                                                disabled={isSaving}
                                                className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Mettre à jour
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-4 py-2 px-3 bg-white rounded-lg border border-slate-100">
                                            {youtubeId ? (
                                                <>
                                                    <div className="relative w-32 aspect-video rounded-md overflow-hidden bg-slate-200 shrink-0 shadow-sm">
                                                        <img src={thumbnailUrl!} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                            <Play className="w-6 h-6 text-white fill-current" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900">Vidéo détectée : <span className="text-amber-600 font-mono">{youtubeId}</span></p>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-400 italic">Lien non détecté ou invalide.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Academy (Certificates) */}
                <TabsContent value="academy" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration de l'Académie</CardTitle>
                            <CardDescription>Paramètres visuels et textes pour les diplômes et certificats.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Titre du Certificat</label>
                                    <Input
                                        value={academySettings?.title || ''}
                                        onChange={(e) => setAcademySettings(prev => prev ? { ...prev, title: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sous-titre</label>
                                    <Input
                                        value={academySettings?.subtitle || ''}
                                        onChange={(e) => setAcademySettings(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Signataire (Nom)</label>
                                    <Input
                                        value={academySettings?.signatureName || ''}
                                        onChange={(e) => setAcademySettings(prev => prev ? { ...prev, signatureName: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Signataire (Rôle)</label>
                                    <Input
                                        value={academySettings?.signatureRole || ''}
                                        onChange={(e) => setAcademySettings(prev => prev ? { ...prev, signatureRole: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Couleur Principale</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            className="w-12 p-1"
                                            value={academySettings?.primaryColor || '#000000'}
                                            onChange={(e) => setAcademySettings(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                                        />
                                        <Input
                                            value={academySettings?.primaryColor || ''}
                                            onChange={(e) => setAcademySettings(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Texte Logo</label>
                                    <Input
                                        value={academySettings?.logoText || ''}
                                        onChange={(e) => setAcademySettings(prev => prev ? { ...prev, logoText: e.target.value } : null)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <Button
                                    variant="link"
                                    className="text-amber-600 gap-1 p-0"
                                    onClick={() => window.location.href = '/dashboard/admin/settings/certificates'}
                                >
                                    <Palette className="w-4 h-4" /> Éditeur Visual Avancé
                                </Button>
                                <Button onClick={handleSaveAcademy} disabled={isSaving} className="gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Mettre à jour Académie
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Global Note */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex gap-3">
                <Settings2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                    Ces réglages affectent directement les composants critiques du site (Marketing, Académie, Facturation).
                    Toute modification est effective après enregistrement et peut influencer l'expérience utilisateur globale.
                </p>
            </div>
        </div>
    );
}

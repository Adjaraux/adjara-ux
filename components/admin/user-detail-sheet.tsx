'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Mail, Phone, MapPin, Building2, Globe, Calendar,
    Shield, Briefcase, ExternalLink, User, Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserDetailSheetProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
    if (!user) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copié !`);
    };

    // Helper for fallback text
    const displayValue = (value: string | null | undefined) => {
        if (!value || value.trim() === '') return <span className="text-slate-400 italic">Non renseigné</span>;
        return <span className="text-slate-900 font-medium">{value}</span>;
    };

    const isClient = user.role === 'client';
    const agencyData = user.agency_clients; // Joined data

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="pb-6 border-b border-slate-100">
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 mb-4 border-4 border-slate-50 shadow-sm">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-2xl bg-slate-100 text-slate-500">
                                {user.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <SheetTitle className="text-2xl font-bold text-slate-900">
                            {user.full_name || 'Utilisateur Sans Nom'}
                        </SheetTitle>

                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant={user.role === 'client' ? 'default' : 'secondary'} className="capitalize">
                                {user.role === 'eleve' ? 'Étudiant' : user.role}
                            </Badge>
                            <Badge variant={user.status === 'banned' ? 'destructive' : 'outline'} className={user.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                                {user.status === 'active' ? 'Actif' : 'Banni'}
                            </Badge>
                        </div>

                        <div className="flex gap-2 mt-4 text-sm text-slate-500 items-center bg-slate-50 px-3 py-1 rounded-full border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => copyToClipboard(user.id, "ID Utilisateur")}>
                            <span className="font-mono text-xs">{user.id}</span>
                            <Copy className="w-3 h-3" />
                        </div>
                    </div>
                </SheetHeader>

                <div className="mt-6">
                    <Tabs defaultValue="contact" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="contact">Contact & Infos</TabsTrigger>
                            <TabsTrigger value="activity">Activité & Stats</TabsTrigger>
                        </TabsList>

                        {/* --- CONTACT TAB --- */}
                        <TabsContent value="contact" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

                            {/* Personal Contact */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4 text-indigo-600" /> Personnel
                                </h3>
                                <div className="grid gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <span className="text-sm text-slate-500 flex items-center gap-2"><Mail className="w-3 h-3" /> Email</span>
                                        <div className="col-span-2 text-sm break-all">{displayValue(user.email)}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <span className="text-sm text-slate-500 flex items-center gap-2"><Phone className="w-3 h-3" /> Téléphone</span>
                                        <div className="col-span-2 text-sm">{displayValue(user.phone)}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="w-3 h-3" /> Inscrit le</span>
                                        <div className="col-span-2 text-sm font-medium">
                                            {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: fr })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Company Info (Clients Only) */}
                            {isClient && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-indigo-600" /> Entreprise
                                    </h3>
                                    <div className="grid gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <span className="text-sm text-slate-500">Société</span>
                                            <div className="col-span-2 text-sm">{displayValue(agencyData?.company_name)}</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <span className="text-sm text-slate-500">Secteur</span>
                                            <div className="col-span-2 text-sm">{displayValue(agencyData?.industry)}</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <span className="text-sm text-slate-500 flex items-center gap-2"><Globe className="w-3 h-3" /> Site Web</span>
                                            <div className="col-span-2 text-sm">
                                                {agencyData?.website_url ? (
                                                    <a href={agencyData.website_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                                        {agencyData.website_url} <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                ) : displayValue(null)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-start">
                                            <span className="text-sm text-slate-500 flex items-center gap-2 mt-1"><MapPin className="w-3 h-3" /> Adresse</span>
                                            <div className="col-span-2 text-sm whitespace-pre-wrap">
                                                {displayValue(agencyData?.billing_address?.full_address || agencyData?.billing_address)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <span className="text-sm text-slate-500">Type</span>
                                            <div className="col-span-2 text-sm capitalize">{displayValue(agencyData?.client_type === 'company' ? 'Société' : 'Particulier')}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* --- ACTIVITY TAB --- */}
                        <TabsContent value="activity" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
                                    <div className="text-3xl font-bold text-indigo-600 mb-1">
                                        {user.projects_count || 0}
                                    </div>
                                    <p className="text-xs text-indigo-700 font-medium uppercase tracking-wide">
                                        {isClient ? 'Projets Totaux' : 'Missions Réalisées'}
                                    </p>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-center">
                                    <div className="text-3xl font-bold text-amber-600 mb-1">
                                        {user.active_projects_count || 0}
                                    </div>
                                    <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                                        En Cours
                                    </p>
                                </div>
                            </div>

                            {/* Placeholder for future detailed history */}
                            <div className="text-center py-8 text-slate-400 text-sm italic">
                                Historique détaillé des activités à venir...
                            </div>
                        </TabsContent>

                    </Tabs>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

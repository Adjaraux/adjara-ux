'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type ProjectType = 'prestation' | 'formation' | '';
type FormationBranch = 'physique' | 'digitale' | 'tech' | '';
type FormationDuration = '9' | '27' | '36' | '';
type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactForm() {
    const [status, setStatus] = useState<Status>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [projectType, setProjectType] = useState<ProjectType>('');
    const [formationBranch, setFormationBranch] = useState<FormationBranch>('');
    const [formationDuration, setFormationDuration] = useState<FormationDuration>('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const { error } = await supabase
                .from('inscriptions')
                .insert([{
                    nom: formData.name,
                    email: formData.email,
                    telephone: formData.phone,
                    type_projet: projectType,
                    message: formData.message,
                    branche: projectType === 'formation' ? formationBranch : null,
                    duree_pack: projectType === 'formation' ? formationDuration : null,
                }]);

            if (error) throw error;
            setStatus('success');
        } catch (error: any) {
            setErrorMessage(error.message || "Erreur de connexion");
            setStatus('error');
        }
    };

    return (
        <section id="contact" className="py-24 px-4 bg-[#05080f]">
            <div className="container mx-auto max-w-4xl">
                <Card className="bg-white/5 border-white/10 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm">
                    <CardHeader className="bg-transparent border-b border-white/10 p-8">
                        <CardTitle className="text-white text-3xl font-bold">Démarrons <span className="text-brand-orange">Ensemble</span></CardTitle>
                        <CardDescription className="text-slate-400">Réponse garantie sous 24h</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        {status === 'success' ? (
                            <div className="text-center py-10">
                                <CheckCircle2 className="w-16 h-16 text-brand-orange mx-auto mb-4 animate-pulse" />
                                <h3 className="text-xl font-bold text-white">Message envoyé avec succès !</h3>
                                <Button className="mt-4 bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => setStatus('idle')}>Nouvel envoi</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-300 font-medium">Type de besoin *</Label>
                                    <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white focus:ring-brand-orange rounded-xl">
                                            <SelectValue placeholder="Sélectionnez un type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#05080f] border-white/10 text-white">
                                            <SelectItem value="prestation">Prestation de Service</SelectItem>
                                            <SelectItem value="formation">Formation / Académie</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 font-medium">Nom complet *</Label>
                                        <Input
                                            name="name"
                                            placeholder="John Doe"
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 bg-white/5 border-white/10 text-white focus:ring-brand-orange rounded-xl placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 font-medium">Email *</Label>
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 bg-white/5 border-white/10 text-white focus:ring-brand-orange rounded-xl placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                {projectType === 'formation' && (
                                    <div className="p-6 bg-brand-orange/5 rounded-2xl space-y-4 border border-brand-orange/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-brand-orange text-sm font-semibold uppercase tracking-wider">Branche d'étude</Label>
                                            <Select value={formationBranch} onValueChange={(v) => setFormationBranch(v as FormationBranch)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-brand-orange rounded-xl">
                                                    <SelectValue placeholder="Choisir une branche" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#05080f] border-white/10 text-white">
                                                    <SelectItem value="physique">Marquage & Signalétique</SelectItem>
                                                    <SelectItem value="digitale">Design & UI/UX</SelectItem>
                                                    <SelectItem value="tech">Développement & IA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-brand-orange text-sm font-semibold uppercase tracking-wider">Durée du cursus</Label>
                                            <Select value={formationDuration} onValueChange={(v) => setFormationDuration(v as FormationDuration)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-brand-orange rounded-xl">
                                                    <SelectValue placeholder="Choisir la durée" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#05080f] border-white/10 text-white">
                                                    <SelectItem value="9">Pack Essentiel (9 mois)</SelectItem>
                                                    <SelectItem value="27">Pack Expert (27 mois)</SelectItem>
                                                    <SelectItem value="36">Master Academy (36 mois)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-slate-300 font-medium">Message *</Label>
                                    <div className="relative">
                                        <Textarea
                                            name="message"
                                            placeholder="Décrivez votre projet ou vos motivations..."
                                            onChange={handleInputChange}
                                            required
                                            className="min-h-[150px] bg-white/5 border-white/10 text-white focus:ring-brand-orange rounded-xl p-4 placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-2 text-sm font-medium">
                                        <AlertCircle size={18} /> {errorMessage}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-14 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-xl shadow-lg shadow-brand-orange/20 text-lg transition-all active:scale-[0.98]" disabled={status === 'loading'}>
                                    {status === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" size={20} />}
                                    Envoyer ma demande
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
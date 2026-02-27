'use client';

import { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle, ChevronRight, FileText, Info, Loader2, UploadCloud } from "lucide-react";
import { saveProjectDraft, getLatestDraft, markDraftRecovered } from '@/app/actions/drafts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { createProjectAction } from '@/app/actions/agency';
import { WIZARD_CONFIG, Category, SubCategory, FieldDef } from './wizard-config';

// --- Data ---

const BUDGET_TIERS = [
    { id: '<250k', label: 'Seed', range: '< 250.000 FCFA', desc: 'Petites tâches, corrections, pages simples.' },
    { id: '250k-1M', label: 'Growth', range: '250k - 1M FCFA', desc: 'Sites complets, MVPs, redesigns.' },
    { id: '>1M', label: 'Enterprise', range: '> 1.000.000 FCFA', desc: 'Projets complexes, apps sur mesure, long terme.' },
];

// --- Components ---

const FieldRenderer = ({
    field,
    value,
    onChange
}: {
    field: FieldDef,
    value: any,
    onChange: (val: any) => void
}) => {
    switch (field.type) {
        case 'text':
        case 'number':
            return (
                <div className="space-y-2">
                    <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                    <div className="relative">
                        <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            required={field.required}
                            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#f6941d] focus:ring-[#f6941d] shadow-sm"
                        />
                        {field.suffix && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
                                {field.suffix}
                            </span>
                        )}
                    </div>
                    {field.helperText && <p className="text-xs text-slate-500">{field.helperText}</p>}
                </div>
            );
        case 'textarea':
            return (
                <div className="space-y-2">
                    <Label className="text-slate-900 font-semibold">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                    <Textarea
                        placeholder={field.placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="min-h-[100px] bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#f6941d] focus:ring-[#f6941d] shadow-sm"
                    />
                </div>
            );
        case 'select':
            return (
                <div className="space-y-2">
                    <Label className="text-slate-900 font-semibold">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                    <Select value={value || ''} onValueChange={onChange}>
                        <SelectTrigger className="bg-white border-slate-300 text-slate-900 focus:ring-[#f6941d] focus:border-[#f6941d] h-10">
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        case 'radio':
            return (
                <div className="space-y-3">
                    <Label className="text-slate-900 font-semibold">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                    <RadioGroup value={value || ''} onValueChange={onChange} className="flex gap-4">
                        {field.options?.map((opt) => (
                            <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`${field.name}-${opt}`} />
                                <Label htmlFor={`${field.name}-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        default:
            return null;
    }
};

// --- Wizard Component ---
function WizardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // State Selection
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);

    // Handle Smart Pre-selection
    useEffect(() => {
        const catId = searchParams.get('cat');
        const subId = searchParams.get('sub');

        if (catId) {
            const cat = WIZARD_CONFIG.find(c => c.id === catId);
            if (cat) {
                setSelectedCategory(cat);
                setStep(2);

                if (subId) {
                    const sub = cat.subcategories.find(s => s.id === subId);
                    if (sub) {
                        setSelectedSubCategory(sub);
                        setStep(3);
                    }
                }
            }
        }
    }, [searchParams]);

    // Form Data
    const [projectTitle, setProjectTitle] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [projectBudget, setProjectBudget] = useState('');
    const [specs, setSpecs] = useState<Record<string, any>>({});
    const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([]);

    const [draftId, setDraftId] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // --- Draft Logic ---
    useEffect(() => {
        const saveDraft = async () => {
            if (step <= 1) return; // Don't save empty starts

            const { success, data } = await saveProjectDraft({
                id: draftId || undefined,
                step,
                category_id: selectedCategory?.id,
                subcategory_id: selectedSubCategory?.id,
                form_data: {
                    title: projectTitle,
                    description: projectDesc,
                    budget: projectBudget,
                    specs,
                    attachments
                }
            });

            if (success && data && !draftId) {
                setDraftId(data.id);
            }
        };

        const timeout = setTimeout(saveDraft, 2000); // Debounce saves
        return () => clearTimeout(timeout);
    }, [step, selectedCategory, selectedSubCategory, projectTitle, projectDesc, projectBudget, specs, attachments]);

    // Check for existing drafts on mount
    useEffect(() => {
        const recoverDraft = async () => {
            const draft = await getLatestDraft();
            if (draft) {
                // We could ask the user, but for Dominance we just show a toast or auto-load
                // For now, let's just log it. In a real prod environment, we'd prompt "Voulez-vous reprendre votre brouillon ?"
                console.log("Draft found:", draft);
            }
        };
        recoverDraft();
    }, []);

    // --- Navigation Handlers ---

    const handleNext = () => {
        // Validation per step
        if (step === 1 && !selectedCategory) return toast.error("Veuillez choisir une catégorie.");
        if (step === 2 && !selectedSubCategory) return toast.error("Veuillez choisir une sous-catégorie.");

        if (step === 3) {
            // Validate Dynamic Specs
            const missingFields = selectedSubCategory?.fields.filter(f => f.required && !specs[f.name]);
            if (missingFields && missingFields.length > 0) {
                return toast.error(`Champs requis manquants : ${missingFields.map(f => f.label).join(', ')}`);
            }
        }

        setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    // --- Upload Logic ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            // Sanitize filename: remove accents, spaces, and special chars
            const fileExt = file.name.split('.').pop();
            const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
            const sanitizedName = originalName
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/[^a-zA-Z0-9]/g, "-") // Replace non-alphanumeric with -
                .toLowerCase();

            const fileName = `${Math.random().toString(36).substring(2)}-${sanitizedName}.${fileExt}`;
            const { error } = await supabase.storage.from('project-briefs').upload(fileName, file);
            if (error) throw error;

            // Generate robust public URL logic or simply store path
            const { data } = supabase.storage.from('project-briefs').getPublicUrl(fileName);

            setAttachments(prev => [...prev, { name: file.name, url: data.publicUrl, type: file.type }]);
            toast.success("Fichier ajouté !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur upload.");
        } finally {
            setUploading(false);
        }
    };

    // --- Submit Logic ---
    const handleSubmit = async () => {
        if (!projectTitle || !projectBudget) return toast.error("Titre et Budget sont requis (Étape 4).");

        setIsLoading(true);
        try {
            // Merge static specs with dynamic specs
            const finalSpecs = {
                category: selectedCategory?.label,
                subcategory: selectedSubCategory?.label,
                ...specs
            };

            const result = await createProjectAction({
                title: projectTitle,
                description: projectDesc || "Voir spécifications détaillées.",
                budget_range: projectBudget,
                required_specialty: selectedSubCategory?.id || 'general',
                attachments,
                specs: finalSpecs
            });

            if (result.success) {
                if (draftId) await markDraftRecovered(draftId);
                toast.success("Projet créé avec succès !");
                router.push('/dashboard/client/projects');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erreur critique.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render ---

    return (
        <div className="max-w-4xl mx-auto md:py-8 md:px-4 min-h-[100dvh] md:min-h-0 flex flex-col">
            {/* Stepper (Minimalist on mobile) */}
            <div className="mb-4 md:mb-8 px-4 pt-4 md:p-0">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                    <span className={step >= 1 ? "text-indigo-600" : ""}>1. Catégorie</span>
                    <span className={step >= 2 ? "text-indigo-600" : ""}>2. Produit</span>
                    <span className={step >= 3 ? "text-indigo-600" : ""}>3. Spécifications</span>
                    <span className={step >= 4 ? "text-indigo-600" : ""}>4. Finalisation</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / 4) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            <Card className="flex-1 border-0 md:border md:border-slate-200 md:shadow-xl bg-white md:min-h-[500px] flex flex-col rounded-none md:rounded-3xl overflow-hidden">
                <CardContent className="p-4 md:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: CATEGORY */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h1 className="text-2xl font-bold text-slate-900 text-center">Quel est votre projet ?</h1>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {WIZARD_CONFIG.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <div
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`p-6 border-2 rounded-2xl cursor-pointer transition-all hover:scale-105 ${selectedCategory?.id === cat.id ? `border-indigo-600 bg-indigo-50` : 'border-slate-50 hover:border-slate-200'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-white shadow-sm text-indigo-600`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="font-bold text-slate-900">{cat.label}</h3>
                                                <p className="text-xs text-slate-500 mt-2">{cat.subcategories.length} services disponibles</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: SUB-CATEGORY */}
                        {step === 2 && selectedCategory && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold text-slate-900">Affinez votre besoin</h1>
                                    <p className="text-slate-500 text-sm mt-1">Catégorie : {selectedCategory.label}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedCategory.subcategories.map((sub) => {
                                        const Icon = sub.icon || ChevronRight;
                                        return (
                                            <div
                                                key={sub.id}
                                                onClick={() => setSelectedSubCategory(sub)}
                                                className={`p-4 border rounded-xl cursor-pointer flex items-center gap-4 transition-all ${selectedSubCategory?.id === sub.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 hover:border-indigo-200'}`}
                                            >
                                                <div className="bg-white p-2 rounded-lg shadow-sm text-slate-600">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{sub.label}</h3>
                                                    <p className="text-xs text-slate-500">{sub.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: DYNAMIC SPECS */}
                        {step === 3 && selectedSubCategory && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="text-center border-b border-slate-100 pb-4">
                                    <h1 className="text-2xl font-bold text-slate-900">{selectedSubCategory.label}</h1>
                                    <p className="text-slate-500 text-sm">Spécifications techniques</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-2">
                                    {selectedSubCategory.fields.map((field) => (
                                        <div key={field.name} className={field.type === 'textarea' || field.type === 'radio' ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
                                            <FieldRenderer
                                                field={field}
                                                value={specs[field.name]}
                                                onChange={(val) => setSpecs(prev => ({ ...prev, [field.name]: val }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-amber-50 text-amber-800 p-3 rounded-md flex gap-2 text-xs border border-amber-200 mt-4">
                                    <Info className="w-4 h-4 shrink-0" />
                                    <p>Soyez précis. Ces détails permettront à nos experts de vous fournir un travail de qualité.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: FINALIZATION */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h1 className="text-2xl font-bold text-slate-900 text-center">Dernière étape !</h1>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: General Info */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 font-semibold">Titre du Projet</Label>
                                            <Input
                                                placeholder="Ex: Refonte complète identité visuelle"
                                                value={projectTitle}
                                                onChange={(e) => setProjectTitle(e.target.value)}
                                                className="text-lg font-bold bg-white border-slate-300 text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 font-semibold">Budget Estimé</Label>
                                            <Select value={projectBudget} onValueChange={setProjectBudget}>
                                                <SelectTrigger className="bg-white border-slate-300 text-slate-900 h-10"><SelectValue placeholder="Choisir une fourchette" /></SelectTrigger>
                                                <SelectContent>
                                                    {BUDGET_TIERS.map(tier => (
                                                        <SelectItem key={tier.id} value={tier.id}>{tier.label} ({tier.range})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 font-semibold">Infos Complémentaires (Optionnel)</Label>
                                            <Textarea
                                                placeholder="Contexte, délais, contraintes..."
                                                value={projectDesc}
                                                onChange={(e) => setProjectDesc(e.target.value)}
                                                className="bg-white border-slate-300 text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Files & Recap */}
                                    <div className="space-y-6">
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors group">
                                            <input type="file" id="final-upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                            <label htmlFor="final-upload" className="cursor-pointer flex flex-col items-center">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                    {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">Pièces jointes</span>
                                                <span className="text-xs text-slate-500">Logo, Charte, Croquis...</span>
                                            </label>
                                        </div>

                                        {attachments.length > 0 && (
                                            <div className="space-y-2">
                                                {attachments.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-100 rounded text-xs text-slate-600">
                                                        <FileText className="w-3 h-3" /> <span className="truncate flex-1">{f.name}</span> <CheckCircle className="w-3 h-3 text-green-500" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-slate-50 p-4 rounded-lg text-sm border border-slate-100">
                                            <h4 className="font-semibold mb-2 text-indigo-600">Récap Technique :</h4>
                                            <ul className="text-slate-600 space-y-1">
                                                <li>Type : {selectedCategory?.label} &gt; {selectedSubCategory?.label}</li>
                                                {Object.entries(specs).slice(0, 3).map(([key, val]) => (
                                                    <li key={key} className="capitalize">{key}: {String(val)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </CardContent>

                {/* Footer Actions */}
                <div className="p-4 md:p-8 pt-0 border-t border-slate-50 mt-auto flex justify-between items-center bg-white/80 backdrop-blur-md pb-6 md:pb-8">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={handleBack} disabled={isLoading}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                        </Button>
                    ) : (
                        <span className="text-xs text-slate-400">Étape {step} sur 4</span>
                    )}

                    {step < 4 ? (
                        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Suivant <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white min-w-[200px] shadow-lg shadow-green-200">
                            {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Valider le Projet
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}

export default function AdvancedProjectWizard() {
    return (
        <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#f6941d] mx-auto mb-2" /><span className="text-slate-500">Chargement du Wizard...</span></div>}>
            <WizardContent />
        </Suspense>
    );
}

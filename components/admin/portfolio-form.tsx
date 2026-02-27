'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createBrowserClient } from '@supabase/ssr';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select';
import { ImageUpload } from './image-upload';
import { PORTFOLIO_POHLS, SUB_CATEGORIES_MAP, ProjectPohl } from '@/lib/portfolio-data';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SubmitErrorHandler } from 'react-hook-form';

const portfolioSchema = z.object({
    title: z.string().min(2, "Le titre est requis"),
    slug: z.string().min(2, "Le slug est requis"),
    description: z.string().min(10, "La description doit faire au moins 10 caractères"),
    pohl: z.enum(['textile-perso', 'design-dev', 'engraving']),
    category: z.string().min(1, "La catégorie est requise"),
    imageUrl: z.string().min(1, "L'image est requise"),
    videoUrl: z.string().default(""),
    year: z.string().min(4, "L'année est requise"),
    client: z.string().default(""),
    wizardPath: z.string().default(""),
    techSpecs: z.string().default(""),
    sortOrder: z.number().default(0),
    links: z.object({
        web: z.string().default(""),
        appStore: z.string().default(""),
        playStore: z.string().default(""),
    }).default({ web: '', appStore: '', playStore: '' }),
});

type PortfolioFormValues = z.infer<typeof portfolioSchema>;

interface PortfolioFormProps {
    project?: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PortfolioForm({ project, isOpen, onClose, onSuccess }: PortfolioFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const form = useForm<PortfolioFormValues>({
        resolver: zodResolver(portfolioSchema) as any,
        defaultValues: {
            title: project?.title || '',
            slug: project?.slug || '',
            description: project?.description || '',
            pohl: project?.pohl || 'textile-perso',
            category: project?.category || '',
            imageUrl: project?.imageUrl || '',
            videoUrl: project?.videoUrl || '',
            year: project?.year || new Date().getFullYear().toString(),
            client: project?.client || '',
            wizardPath: project?.wizardPath || '',
            techSpecs: project?.techSpecs || '',
            sortOrder: project?.sort_order ?? 0,
            links: project?.links || {
                web: '',
                appStore: '',
                playStore: '',
            }
        }
    });

    // Reset form when project changes
    useEffect(() => {
        if (isOpen && project) {
            form.reset({
                title: project.title || '',
                slug: project.slug || '',
                description: project.description || '',
                pohl: project.pohl || 'textile-perso',
                category: project.category || '',
                imageUrl: project.imageUrl || '',
                videoUrl: project.videoUrl || '',
                year: project.year || '',
                client: project.client || '',
                wizardPath: project.wizardPath || '',
                techSpecs: project.techSpecs || '',
                sortOrder: (typeof project.sortOrder === 'number' ? project.sortOrder : project.sort_order) ?? 0,
                links: project.links || { web: '', appStore: '', playStore: '' }
            });
        } else if (isOpen && !project) {
            form.reset({
                title: '',
                slug: '',
                description: '',
                pohl: 'textile-perso',
                category: '',
                imageUrl: '',
                videoUrl: '',
                year: new Date().getFullYear().toString(),
                client: '',
                wizardPath: '',
                techSpecs: '',
                sortOrder: 0,
                links: { web: '', appStore: '', playStore: '' }
            });
        }
    }, [isOpen, project, form]);

    const selectedPohl = form.watch('pohl') as ProjectPohl;

    const onSubmit: SubmitHandler<PortfolioFormValues> = async (values) => {
        setIsSubmitting(true);

        // Auto-calculate wizardPath if not provided
        const wizardPath = values.wizardPath || `/dashboard/client/projects/new?cat=${values.pohl}&sub=${values.category}`;

        // Map camelCase to snake_case for Supabase
        const dbData = {
            title: values.title,
            slug: values.slug,
            description: values.description,
            pohl: values.pohl,
            category: values.category,
            image_url: values.imageUrl,
            video_url: values.videoUrl,
            year: values.year,
            client: values.client,
            wizard_path: wizardPath,
            tech_specs: values.techSpecs,
            sort_order: values.sortOrder,
            links: values.links,
        };

        try {
            const { error } = project
                ? await supabase.from('portfolio_projects').update(dbData).eq('id', project.id)
                : await supabase.from('portfolio_projects').insert([dbData]);

            if (error) {
                throw error;
            }

            toast.success(project ? "Projet mis à jour" : "Projet ajouté");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue lors de l'enregistrement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onInvalid: SubmitErrorHandler<PortfolioFormValues> = (errors) => {
        const firstError = Object.values(errors)[0];
        toast.error(`Erreur : ${firstError?.message || "Veuillez vérifier les champs"}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{project ? 'Modifier le projet' : 'Ajouter un nouveau projet'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Titre du projet</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: Aura Luxury Branding" {...field} onChange={(e) => {
                                                    field.onChange(e);
                                                    if (!project) {
                                                        form.setValue('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                                                    }
                                                }} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Slug (URL)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: aura-luxury" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="pohl"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Pôle</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner un pôle" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {PORTFOLIO_POHLS.filter(p => p.id !== 'all').map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Catégorie</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {SUB_CATEGORIES_MAP[selectedPohl]?.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="year"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Année</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="client"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Client</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Apple" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Media & Details */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="imageUrl"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Image Principale</FormLabel>
                                            <FormControl>
                                                <ImageUpload
                                                    bucketName="portfolio-assets"
                                                    folderPath="projects"
                                                    currentPath={field.value}
                                                    onUploadComplete={(path) => {
                                                        const publicUrl = supabase.storage.from('portfolio-assets').getPublicUrl(path).data.publicUrl;
                                                        field.onChange(publicUrl);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="videoUrl"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Vidéo Loop (Optionnel)</FormLabel>
                                            <FormControl>
                                                <ImageUpload
                                                    bucketName="portfolio-assets"
                                                    folderPath="projects/videos"
                                                    allowedTypes="video"
                                                    currentPath={field.value}
                                                    onUploadComplete={(path) => {
                                                        const publicUrl = supabase.storage.from('portfolio-assets').getPublicUrl(path).data.publicUrl;
                                                        field.onChange(publicUrl);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Décrivez le projet en quelques lignes..."
                                                    className="h-32"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sortOrder"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Ordre d'affichage</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>Plus le nombre est bas, plus il apparaît en premier.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Specific Sub-forms */}
                        <div className="pt-4 border-t border-slate-100">
                            {selectedPohl === 'design-dev' ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="links.web"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Lien Web</FormLabel>
                                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="links.appStore"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>App Store</FormLabel>
                                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="links.playStore"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Play Store</FormLabel>
                                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="techSpecs"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Spécifications Techniques (Loupe)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: Découpe Laser 0.01mm, Fil de soie..." {...field} />
                                            </FormControl>
                                            <FormDescription>Détails affichés sous le titre pour souligner la précision.</FormDescription>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {project ? 'Mettre à jour' : 'Enregistrer le projet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

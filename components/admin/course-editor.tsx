'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { LessonManager } from '@/components/admin/lesson-manager';

interface CourseEditorProps {
    courseId?: string; // Optional: If present, we are in Edit Mode
}

export function CourseEditor({ courseId }: CourseEditorProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(!!courseId);

    // UI State
    const [activeTab, setActiveTab] = useState<'general' | 'curriculum'>('general');

    // Form State
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [category, setCategory] = useState<string>('tronc_commun');
    const [specialty, setSpecialty] = useState<string>('none');
    const [unlockMonth, setUnlockMonth] = useState(0);
    const [description, setDescription] = useState('');
    const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Initial Fetch (Edit Mode)
    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (data) {
                setTitle(data.title);
                setSlug(data.slug);
                setCategory(data.category);
                setSpecialty(data.related_specialty || 'none');
                setUnlockMonth(data.unlock_at_month);
                setDescription(data.description);
                setThumbnailPath(data.thumbnail_url);
            } else {
                console.error("Fetch Error:", error);
            }
            setIsFetching(false);
        };

        fetchCourse();
    }, [courseId]);

    // Auto-generate slug from title (Only in create mode)
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        if (!courseId) {
            setSlug(val.toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special chars
                .replace(/\s+/g, '-')     // Replace spaces with -
                .replace(/--+/g, '-')     // Replace multiple - with single -
            );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                title,
                slug,
                category,
                related_specialty: category === 'specialite' ? specialty : null,
                unlock_at_month: parseInt(unlockMonth.toString()),
                description,
                thumbnail_url: thumbnailPath,
            };

            let error;

            if (courseId) {
                // Update
                const res = await supabase
                    .from('courses')
                    .update(payload)
                    .eq('id', courseId);
                error = res.error;
            } else {
                // Create
                const res = await supabase
                    .from('courses')
                    .insert(payload);
                error = res.error;
            }

            if (error) throw error;

            if (!courseId) {
                router.push('/dashboard/admin/courses');
            } else {
                // Stay on page, just show success? or redirect?
                // Let's just refresh currently
                router.refresh();
                alert("Sauvegardé !");
            }
        } catch (error: any) {
            alert('Erreur: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="p-12 text-center text-slate-500">Chargement du cours...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" type="button" onClick={() => router.push('/dashboard/admin/courses')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{courseId ? 'Modifier le Cours' : 'Nouveau Cours'}</h1>
                        {courseId && <p className="text-sm text-slate-500">{title}</p>}
                    </div>
                </div>
            </div>

            {/* TABS */}
            {courseId && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'general'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Général
                    </button>
                    <button
                        onClick={() => setActiveTab('curriculum')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'curriculum'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Programme
                    </button>
                </div>
            )}

            {/* CONTENT: GENERAL */}
            <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informations Générales</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Titre du cours</Label>
                                        <Input
                                            value={title}
                                            onChange={handleTitleChange}
                                            placeholder="Ex: Maîtriser la Typographie"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slug (URL)</Label>
                                        <Input
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            className="bg-slate-50 font-mono text-sm text-slate-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Visuels</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Image de Couverture</Label>
                                        <ImageUpload
                                            folderPath={`courses/${slug || 'temp'}`}
                                            onUploadComplete={(path) => setThumbnailPath(path)}
                                            currentPath={thumbnailPath}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Paramètres</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Catégorie</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tronc_commun">Trunc Commun</SelectItem>
                                                <SelectItem value="specialite">Spécialité</SelectItem>
                                                <SelectItem value="incubation">Incubation</SelectItem>
                                                <SelectItem value="lab">Lab</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {category === 'specialite' && (
                                        <div className="space-y-2">
                                            <Label>Branche</Label>
                                            <Select value={specialty} onValueChange={setSpecialty}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="textile">Textile</SelectItem>
                                                    <SelectItem value="gravure">Gravure</SelectItem>
                                                    <SelectItem value="digital">Digital</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Déblocage (Mois)</Label>
                                        <Input
                                            type="number"
                                            value={unlockMonth}
                                            onChange={(e) => setUnlockMonth(parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {courseId ? 'Mettre à jour' : 'Créer le cours'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* CONTENT: CURRICULUM */}
            {courseId && activeTab === 'curriculum' && (
                <div className="animate-in fade-in">
                    <LessonManager courseId={courseId} courseSlug={slug} />
                </div>
            )}

            {/* Helper for new courses */}
            {!courseId && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                    ℹ️ Créez d'abord le cours pour accéder à l'onglet "Programme" et ajouter des leçons.
                </div>
            )}
        </div>
    );


}

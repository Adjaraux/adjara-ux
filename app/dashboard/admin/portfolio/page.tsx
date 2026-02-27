'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    ExternalLink,
    Pencil,
    Trash2,
    Briefcase,
    LayoutGrid,
    Table as TableIcon,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@supabase/ssr';
import { PortfolioProject } from '@/lib/portfolio-data';
import { toast } from 'sonner';
import { PortfolioForm } from '@/components/admin/portfolio-form';

export default function AdminPortfolioPage() {
    const [projects, setProjects] = useState<PortfolioProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    // Form Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('portfolio_projects')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase Fetch Error:", error);
            // On ne bloque pas l'affichage, mais on informe
            toast.error("Note: La colonne 'sort_order' semble manquer. Veuillez appliquer la migration SQL.");
        } else if (data) {
            // Map snake_case to camelCase
            const mappedData = data.map((p: any) => ({
                ...p,
                imageUrl: p.image_url,
                videoUrl: p.video_url,
                wizardPath: p.wizard_path,
                techSpecs: p.tech_specs,
                sortOrder: p.sort_order,
            }));
            setProjects(mappedData as any);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;

        const { error } = await supabase
            .from('portfolio_projects')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("Erreur lors de la suppression");
        } else {
            toast.success("Projet supprimé");
            setProjects(projects.filter(p => p.id !== id));
        }
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.pohl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gestion du Portfolio</h1>
                    <p className="text-slate-500 mt-1">Gérez vos réalisations et leur affichage public.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => window.location.href = '/dashboard/admin/settings'}
                    >
                        Réglages Vidéos
                    </Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold gap-2"
                        onClick={() => {
                            setEditingProject(null);
                            setIsFormOpen(true);
                        }}
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter un projet
                    </Button>
                </div>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Rechercher un projet, un pôle..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('table')}
                        >
                            <TableIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <div className="aspect-video bg-slate-200" />
                            <CardContent className="p-4 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProjects.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <Card key={project.id} className="overflow-hidden group border-slate-200 hover:border-amber-400/50 transition-all shadow-sm">
                                <div className="aspect-video relative overflow-hidden bg-slate-100">
                                    <img
                                        src={project.imageUrl}
                                        alt={project.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Badge className="bg-white/90 text-slate-900 border-none backdrop-blur-sm">
                                            {project.pohl}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900 truncate pr-2">{project.title}</h3>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2" onClick={() => {
                                                    setEditingProject(project);
                                                    setIsFormOpen(true);
                                                }}>
                                                    <Pencil className="w-4 h-4" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => handleDelete(project.id)}>
                                                    <Trash2 className="w-4 h-4" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Badge variant="outline" className="text-[10px] uppercase">{project.category}</Badge>
                                        <span>•</span>
                                        <span>{project.year}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Projet</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pôle</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Catégorie</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Année</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                                    <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-medium text-slate-900">{project.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none">
                                                {project.pohl}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {project.category}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {project.year}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                                    onClick={() => {
                                                        setEditingProject(project);
                                                        setIsFormOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                    onClick={() => handleDelete(project.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">Aucun projet trouvé</h3>
                    <p className="text-slate-500 mt-2">Commencez par ajouter votre première réalisation.</p>
                    <Button
                        className="mt-6 bg-slate-900 hover:bg-slate-800 text-white gap-2"
                        onClick={() => {
                            setEditingProject(null);
                            setIsFormOpen(true);
                        }}
                    >
                        <Plus className="w-5 h-5" /> Ajouter mon premier projet
                    </Button>
                </div>
            )}

            <PortfolioForm
                project={editingProject}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchProjects}
            />
        </div>
    );
}

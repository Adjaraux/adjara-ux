'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Lock, PlusCircle, BookOpen } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface Course {
    id: string;
    title: string;
    category: string;
    unlock_at_month: number;
    related_specialty?: string;
}

export function CourseList({ initialCourses }: { initialCourses: Course[] }) {
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleDelete = async (id: string) => {
        if (!confirm("⚠️ Attention : Supprimer ce cours effacera définitivement tous les chapitres, leçons, quiz et la progression des élèves liés.\n\nÊtes-vous sûr de vouloir continuer ?")) {
            return;
        }

        const { error } = await supabase.from('courses').delete().eq('id', id);

        if (error) {
            alert("Erreur lors de la suppression : " + error.message);
        } else {
            // Optimistic update
            setCourses(courses.filter(c => c.id !== id));
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion des Cours</h1>
                    <p className="text-slate-500">Créez et modifiez le contenu pédagogique.</p>
                </div>
                <Link href="/dashboard/admin/courses/new">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Nouveau Cours
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden">
                        <CardContent className="p-0 flex items-center">
                            {/* Visual Strip */}
                            <div className={`w-2 h-24 ${course.category === 'tronc_commun' ? 'bg-indigo-500' :
                                course.category === 'specialite' ? 'bg-purple-500' : 'bg-slate-300'
                                }`} />

                            {/* Info */}
                            <div className="flex-1 p-6">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${course.category === 'tronc_commun' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        {course.category}
                                    </span>
                                    {course.unlock_at_month > 0 && (
                                        <span className="flex items-center text-xs text-slate-500 font-medium">
                                            <Lock className="w-3 h-3 mr-1" />
                                            Déblocage : Mois {course.unlock_at_month}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg">{course.title}</h3>
                                {course.related_specialty && (
                                    <p className="text-sm text-slate-500 capitalize">Spécialité : {course.related_specialty}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 flex items-center gap-2">
                                <Link href={`/dashboard/admin/courses/${course.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Éditer
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(course.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {courses.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Aucun cours</h3>
                        <p className="text-slate-500">Commencez par ajouter votre premier module.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

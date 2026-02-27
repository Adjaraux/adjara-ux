'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Plus, GripVertical, FileVideo, FileText, Trash2, Edit2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { LessonEditor } from './lesson-editor';

interface LessonManagerProps {
    courseId: string;
    courseSlug: string;
}

type Lesson = {
    id: string;
    title: string;
    type: 'video' | 'text' | 'pdf' | 'quiz';
    status: 'draft' | 'published' | 'scheduled';
    position: number;
    duration: number;
    chapter_id?: string;
    video_url?: string;
    pool_size?: number;
    weight?: number;
};

type Chapter = {
    id: string;
    title: string;
    position: number;
    lessons: Lesson[];
};

// --- SORTABLE COMPONENTS ---

function SortableChapter({ chapter, isActive, onAddLesson, onEditLesson, onDeleteLesson, onDeleteChapter, activeLessonId, editingLesson, courseSlug, onSaveLesson, onCancelEdit }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: chapter.id,
        data: { type: 'chapter', chapter }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <Card ref={setNodeRef} style={style} className={`overflow-hidden border-slate-200 shadow-sm ${isDragging ? 'z-50 ring-2 ring-indigo-500' : ''}`}>
            <CardHeader className="bg-slate-50/50 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 p-1">
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-slate-700">{chapter.title}</h4>
                    <Badge variant="outline" className="text-[10px] text-slate-400 font-normal">
                        {chapter.lessons.length} leçons
                    </Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                        onClick={() => onAddLesson(chapter.id)}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                    {/* Add Delete Chapter Button */}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={onDeleteChapter}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </CardHeader>

            {/* Lessons List Context */}
            {(chapter.lessons.length > 0 || isActive) && (
                <div className="divide-y divide-slate-100 bg-white">
                    <SortableContext items={chapter.lessons} strategy={verticalListSortingStrategy}>
                        {chapter.lessons.map((lesson: Lesson) => (
                            <SortableLesson
                                key={lesson.id}
                                lesson={lesson}
                                chapterId={chapter.id}
                                isEditing={activeLessonId === chapter.id && editingLesson?.id === lesson.id}
                                onEdit={() => onEditLesson(chapter.id, lesson)}
                                onDelete={() => onDeleteLesson(lesson.id)}
                                courseSlug={courseSlug}
                                onSave={onSaveLesson}
                                onCancel={onCancelEdit}
                            />
                        ))}
                    </SortableContext>

                    {/* Create New Lesson Form */}
                    {activeLessonId === chapter.id && !editingLesson && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                            <LessonEditor
                                chapterId={chapter.id}
                                courseSlug={courseSlug}
                                onSaved={onSaveLesson}
                                onCancel={onCancelEdit}
                            />
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}

function SortableLesson({ lesson, chapterId, isEditing, onEdit, onDelete, courseSlug, onSave, onCancel }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: lesson.id,
        data: { type: 'lesson', lesson, chapterId }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    if (isEditing) {
        return (
            <div className="p-4 bg-indigo-50/50 border-y border-indigo-100">
                <LessonEditor
                    chapterId={chapterId}
                    courseSlug={courseSlug}
                    lesson={lesson}
                    onSaved={onSave}
                    onCancel={onCancel}
                />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} className="p-3 pl-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3 w-full">
                <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 p-2">
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className={`p-1.5 rounded-md ${lesson.type === 'video' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {lesson.type === 'video' ? <FileVideo className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-900 transition-colors">
                        {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className={`text-[9px] h-4 px-1.5 ${lesson.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {lesson.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Badge>
                        {lesson.duration > 0 && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <PlayCircle className="w-2.5 h-2.5" />
                                {Math.floor(lesson.duration / 60)} min
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-300 hover:text-slate-600"
                    onClick={onEdit}
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={onDelete}>
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}


// --- MAIN COMPONENT ---

export function LessonManager({ courseId, courseSlug }: LessonManagerProps) {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');

    // Editor State
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | undefined>(undefined);

    // DnD State
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchCurriculum = async () => {
        // Fetch Chapters
        const { data: chaptersData, error: chapError } = await supabase
            .from('chapters')
            .select('*')
            .eq('course_id', courseId)
            .order('position', { ascending: true });

        if (chapError) return;

        // Fetch Lessons
        const chapterIds = chaptersData.map(c => c.id);
        let lessonsData: any[] = [];

        if (chapterIds.length > 0) {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .in('chapter_id', chapterIds)
                .order('position', { ascending: true });

            if (data) lessonsData = data;
        }

        const fullCurriculum = chaptersData.map(chapter => ({
            ...chapter,
            lessons: lessonsData.filter(l => l.chapter_id === chapter.id)
        }));

        setChapters(fullCurriculum);
        setLoading(false);
    };

    useEffect(() => {
        fetchCurriculum();
    }, [courseId]);

    const handleCreateChapter = async () => {
        if (!newChapterTitle.trim()) return;

        const newPosition = chapters.length > 0
            ? Math.max(...chapters.map(c => c.position)) + 1
            : 0;

        const { error } = await supabase
            .from('chapters')
            .insert({ course_id: courseId, title: newChapterTitle, position: newPosition });

        if (!error) {
            setNewChapterTitle('');
            setIsCreatingChapter(false);
            fetchCurriculum();
        }
    };

    // --- DnD HANDLERS ---

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);
        setActiveDragItem(active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        setActiveDragItem(null);

        if (!over) return;

        const activeType = active.data.current?.type;

        // 1. Reorder Chapters
        if (activeType === 'chapter' && active.id !== over.id) {
            const oldIndex = chapters.findIndex(c => c.id === active.id);
            const newIndex = chapters.findIndex(c => c.id === over.id);

            const newChapters = arrayMove(chapters, oldIndex, newIndex);
            setChapters(newChapters); // Optimistic UI

            // RPC
            const ids = newChapters.map(c => c.id);
            await supabase.rpc('reorder_chapters', { item_ids: ids });
            return;
        }

        // 2. Reorder Lessons (Simple: same chapter)
        if (activeType === 'lesson' && active.id !== over.id) {
            const activeLesson = active.data.current?.lesson;
            const chapterId = active.data.current?.chapterId;

            // Find chapter index
            const chapterIndex = chapters.findIndex(c => c.id === chapterId);
            if (chapterIndex === -1) return;

            const chapter = chapters[chapterIndex];
            const oldIndex = chapter.lessons.findIndex(l => l.id === active.id);
            const newIndex = chapter.lessons.findIndex(l => l.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Clone state deeply enough
                const newChapters = [...chapters];
                newChapters[chapterIndex] = {
                    ...chapter,
                    lessons: arrayMove(chapter.lessons, oldIndex, newIndex)
                };

                setChapters(newChapters); // Optimistic UI

                // RPC
                const ids = newChapters[chapterIndex].lessons.map(l => l.id);
                await supabase.rpc('reorder_lessons', { item_ids: ids });
            }
        }
    };

    const handleDeleteChapter = async (chapId: string) => {
        if (!confirm("Supprimer ce module et toutes ses leçons ?")) return;

        const { error } = await supabase.from('chapters').delete().eq('id', chapId);
        if (error) {
            alert("Erreur: " + error.message);
        } else {
            fetchCurriculum();
        }
    };

    const handleDeleteLesson = async (chapId: string, lessId: string) => {
        if (!confirm("Supprimer cette leçon ?")) return;

        const { error } = await supabase.from('lessons').delete().eq('id', lessId);
        if (error) {
            alert("Erreur: " + error.message);
        } else {
            fetchCurriculum();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900">Programme du cours</h3>
                <Button onClick={() => setIsCreatingChapter(true)} size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Module
                </Button>
            </div>

            {isCreatingChapter && (
                <Card className="bg-slate-50 border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <CardContent className="pt-6 flex gap-3 items-center">
                        <Input
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            placeholder="Titre du module (ex: Introduction au Design)"
                            className="bg-white"
                            autoFocus
                        />
                        <Button onClick={handleCreateChapter} disabled={!newChapterTitle.trim()}>
                            Créer
                        </Button>
                        <Button variant="ghost" onClick={() => setIsCreatingChapter(false)}>
                            Annuler
                        </Button>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-12 text-slate-400">Chargement du programme...</div>
            ) : chapters.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                        <FileVideo className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-500">Ce cours n'a pas encore de contenu.</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={chapters} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {chapters.map((chapter) => (
                                <SortableChapter
                                    key={chapter.id}
                                    chapter={chapter}
                                    isActive={activeChapterId === chapter.id}
                                    activeLessonId={activeChapterId}
                                    editingLesson={editingLesson}
                                    courseSlug={courseSlug}
                                    onAddLesson={(id: string) => {
                                        setActiveChapterId(id);
                                        setEditingLesson(undefined);
                                    }}
                                    onEditLesson={(chapId: string, lesson: Lesson) => {
                                        setActiveChapterId(chapId);
                                        setEditingLesson(lesson);
                                    }}
                                    onSaveLesson={() => {
                                        setActiveChapterId(null);
                                        setEditingLesson(undefined);
                                        fetchCurriculum();
                                    }}
                                    onCancelEdit={() => {
                                        setActiveChapterId(null);
                                        setEditingLesson(undefined);
                                    }}
                                    onDeleteChapter={() => handleDeleteChapter(chapter.id)}
                                    onDeleteLesson={(lId: string) => handleDeleteLesson(chapter.id, lId)}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Ghost Overlay when Dragging */}
                    <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                        {activeDragItem?.type === 'chapter' ? (
                            <div className="p-4 bg-white shadow-xl rounded-lg border-2 border-indigo-500 w-[600px] opacity-90">
                                <h4 className="font-bold text-lg">{activeDragItem.chapter.title}</h4>
                            </div>
                        ) : activeDragItem?.type === 'lesson' ? (
                            <div className="p-3 bg-white shadow-xl rounded-md border-2 border-indigo-500 w-[550px] flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${activeDragItem.lesson.type === 'video' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {activeDragItem.lesson.type === 'video' ? <FileVideo className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                </div>
                                <span className="font-medium">{activeDragItem.lesson.title}</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
}

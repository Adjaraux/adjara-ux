'use client';

import { useState, useRef, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Upload } from 'tus-js-client';
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
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UploadCloud, X, Save, FileVideo, FileText, PauseCircle, PlayCircle, Info, CheckCircle } from 'lucide-react';
import { QuizEditor } from './quiz-editor';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'pdf' | 'quiz';
    status: 'draft' | 'published' | 'scheduled';
    video_url?: string;
    content_text?: string;
    duration?: number;
    weight?: number;
    position: number;
    pool_size?: number;
    is_exam?: boolean;
}

interface LessonEditorProps {
    chapterId: string;
    courseSlug: string;
    lesson?: Lesson;
    onSaved: () => void;
    onCancel: () => void;
}

export function LessonEditor({ chapterId, courseSlug, lesson, onSaved, onCancel }: LessonEditorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState(lesson?.title || '');
    const [type, setType] = useState<Lesson['type']>(lesson?.type || 'video');
    const [status, setStatus] = useState<Lesson['status']>(lesson?.status || 'draft');
    const [duration, setDuration] = useState(lesson?.duration || 0);
    const [contentText, setContentText] = useState(lesson?.content_text || '');
    const [weight, setWeight] = useState(lesson?.weight || 1);
    const [poolSize, setPoolSize] = useState(lesson?.pool_size || 10);

    const [videoPath, setVideoPath] = useState(lesson?.video_url || '');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadRef = useRef<any>(null);
    const [supabase] = useState(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ));

    useEffect(() => {
        return () => {
            if (uploadRef.current) uploadRef.current.abort();
        };
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        startUpload(file);
    };

    const startUpload = async (file: File) => {
        console.log("DEBUG: startUpload triggered for file:", file.name, "Size:", file.size);
        setUploadError(null);
        setUploadProgress(0);

        try {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("URL Supabase manquante");

            console.log("DEBUG: Fetching Supabase session...");
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.error("DEBUG: No session found!");
                setUploadError("Session expirée. Veuillez vous reconnecter.");
                return;
            }
            console.log("DEBUG: Session found for user:", session.user.id);

            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const targetPath = `courses/${courseSlug}/lessons/${fileName}`;
            const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`;

            console.log("DEBUG: TUS Endpoint:", endpoint);
            console.log("DEBUG: Target Path:", targetPath);

            if (typeof Upload === 'undefined') {
                throw new Error("TUS Upload constructor is undefined. Check library import.");
            }

            const upload = new Upload(file, {
                endpoint,
                retryDelays: [0, 3000, 5000, 10000],
                headers: {
                    authorization: `Bearer ${session.access_token}`,
                    'x-upsert': 'true',
                },
                uploadDataDuringCreation: false,
                removeFingerprintOnSuccess: true,
                chunkSize: 6 * 1024 * 1024, // 6MB chunks
                metadata: {
                    bucketName: 'academy_content',
                    objectName: targetPath,
                    contentType: file.type,
                },
                onError: (error) => {
                    console.error("DEBUG: TUS onError:", error);
                    setIsUploading(false);
                    setUploadError("Erreur upload: " + error.message);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const pct = Math.round((bytesUploaded / bytesTotal) * 100);
                    console.log(`DEBUG: Upload Progress: ${pct}% (${bytesUploaded}/${bytesTotal})`);
                    setUploadProgress(pct);
                },
                onSuccess: () => {
                    console.log("DEBUG: Upload Success!");
                    setIsUploading(false);
                    setVideoPath(targetPath);
                },
                onAfterResponse: (req, res) => {
                    const status = res.getStatus();
                    console.log(`DEBUG: TUS Response Status: ${status}`);
                    if (status >= 400) {
                        const body = res.getBody();
                        console.error("DEBUG: TUS Error Response Body:", body);
                        setUploadError(`Erreur Serveur (${status}): ${body || 'Vérifiez vos permissions storage'}`);
                    }
                }
            });

            console.log("DEBUG: Starting TUS upload instance...");
            uploadRef.current = upload;
            setIsUploading(true);
            upload.start();
        } catch (err: any) {
            console.error("DEBUG: Fatal startUpload error:", err);
            setIsUploading(false);
            setUploadError("Initialisation impossible: " + err.message);
        }
    };

    const togglePause = () => {
        if (!uploadRef.current) return;
        if (isUploading) {
            uploadRef.current.abort();
            setIsUploading(false);
        } else {
            uploadRef.current.start();
            setIsUploading(true);
        }
    };

    const handleDeleteMedia = () => {
        if (uploadRef.current) uploadRef.current.abort();
        setVideoPath('');
        setUploadProgress(0);
        setIsUploading(false);
    };

    const handleSave = async () => {
        setIsLoading(true);
        const payload = {
            title, type, status,
            duration: parseInt(duration.toString()) || 0,
            weight: parseInt(weight.toString()) || 1,
            pool_size: parseInt(poolSize.toString()) || 10,
            updated_at: new Date().toISOString(),
            video_url: (type === 'video' || type === 'pdf') ? videoPath : null,
            content_text: type === 'text' ? contentText : null,
        };

        const { error } = lesson
            ? await supabase.from('lessons').update(payload).eq('id', lesson.id)
            : await supabase.from('lessons').insert({ ...payload, chapter_id: chapterId });

        setIsLoading(false);
        if (error) alert('Erreur: ' + error.message);
        else onSaved();
    };

    return (
        <Card className="border-2 border-indigo-100 shadow-lg">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-slate-800">
                        {lesson ? 'Modifier la leçon' : 'Nouvelle Leçon'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-5 h-5" /></Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/3 space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">Vidéo</SelectItem>
                                    <SelectItem value="text">Texte / Article</SelectItem>
                                    <SelectItem value="pdf">Fiche PDF</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-1/3 space-y-2">
                            <Label>Statut</Label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Brouillon</SelectItem>
                                    <SelectItem value="published">Publié</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-1/3 space-y-2">
                            <Label>Coefficient</Label>
                            <Input type="number" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 1)} />
                        </div>
                    </div>

                    {(type === 'video' || type === 'quiz') && (
                        <div className="space-y-2">
                            <Label>{type === 'video' ? 'Durée (sec)' : 'Durée (min)'}</Label>
                            <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
                        </div>
                    )}

                    {type === 'text' && (
                        <div className="space-y-2">
                            <Label>Contenu</Label>
                            <Textarea value={contentText} onChange={(e) => setContentText(e.target.value)} rows={10} />
                        </div>
                    )}

                    {(type === 'pdf' || type === 'video') && (
                        <div className="space-y-4">
                            {uploadError && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                                    <X className="w-4 h-4 mr-2 cursor-pointer" onClick={() => setUploadError(null)} />
                                    {uploadError}
                                </div>
                            )}
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50">
                                {!videoPath && !isUploading ? (
                                    <div className="text-center">
                                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${type === 'video' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                                            {type === 'video' ? <UploadCloud /> : <FileText />}
                                        </div>
                                        <label htmlFor="media-upload" className="cursor-pointer text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                                            <span>Uploader {type === 'video' ? 'une vidéo' : 'un PDF'}</span>
                                            <input
                                                id="media-upload"
                                                type="file"
                                                className="sr-only"
                                                accept={type === 'video' ? 'video/*' : '.pdf'}
                                                onChange={handleFileSelect}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium flex items-center gap-2">
                                                {videoPath ? (
                                                    <><CheckCircle className="w-4 h-4 text-emerald-500" /> Fichier prêt</>
                                                ) : (
                                                    <><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Chargement...</>
                                                )}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">{uploadProgress}%</span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={handleDeleteMedia}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full transition-all duration-300 ${videoPath ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        {!videoPath && (
                                            <div className="flex justify-center pt-2">
                                                <Button variant="outline" size="sm" onClick={togglePause} className="text-xs h-8">
                                                    {isUploading ? <><PauseCircle className="mr-2 w-3.5 h-3.5" /> Pause</> : <><PlayCircle className="mr-2 w-3.5 h-3.5" /> Reprendre</>}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(type === 'quiz' || type === 'video') && (
                        <div className="mt-8 border-t pt-6">
                            {lesson?.id ? (
                                <QuizEditor lessonId={lesson.id} onChanged={() => { }} />
                            ) : (
                                <div className="text-center py-4 bg-slate-50 rounded-xl border-dashed border-2">
                                    <p className="text-sm text-slate-500 mb-2">Créez la leçon pour activer le quiz.</p>
                                    <Button onClick={handleSave} disabled={isLoading} variant="outline">Enregistrer & Editer Quiz</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onCancel}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isLoading || (type === 'video' && !videoPath)}>
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        Enregistrer
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

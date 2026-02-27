'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CheckCircle, Info, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Answer {
    id?: string;
    text: string;
    is_correct: boolean;
    position: number;
}

interface Question {
    id?: string;
    text: string;
    type: 'single' | 'multiple';
    points: number;
    trigger_at?: number | null; // Seconds from start (for In-Video Quiz)
    position: number;
    answers: Answer[];
}

interface QuizEditorProps {
    lessonId: string;
    onChanged: (hasChanges: boolean) => void;
}

export function QuizEditor({ lessonId, onChanged }: QuizEditorProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch existing quiz data
    useEffect(() => {
        const fetchQuiz = async () => {
            // Admin CAN select from 'answers' table normally because of our RLS policy (Admins: ALL)

            // 1. Get Questions
            const { data: questionsData } = await supabase
                .from('questions')
                .select('*')
                .eq('lesson_id', lessonId)
                .order('position');

            if (!questionsData) {
                setLoading(false);
                return;
            }

            const fullQuestions: Question[] = [];

            for (const q of questionsData) {
                // 2. Get Answers for each question
                const { data: answersData } = await supabase
                    .from('answers')
                    .select('*')
                    .eq('question_id', q.id)
                    .order('position');

                fullQuestions.push({
                    ...q,
                    type: q.type as 'single' | 'multiple',
                    trigger_at: q.trigger_at,
                    answers: answersData ? answersData as Answer[] : []
                });
            }

            setQuestions(fullQuestions);
            setLoading(false);
        };

        if (lessonId) fetchQuiz();
    }, [lessonId]);

    const addQuestion = () => {
        setQuestions([...questions, {
            text: '',
            type: 'single',
            points: 1,
            trigger_at: null,
            position: questions.length,
            answers: [
                { text: 'Réponse A', is_correct: true, position: 0 },
                { text: 'Réponse B', is_correct: false, position: 1 }
            ]
        }]);
        onChanged(true);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQs = [...questions];
        newQs[index] = { ...newQs[index], [field]: value };
        setQuestions(newQs);
        onChanged(true);
    };

    const deleteQuestion = (index: number) => {
        const newQs = [...questions];
        newQs.splice(index, 1);
        setQuestions(newQs);
        onChanged(true);
    };

    const updateAnswer = (qIndex: number, aIndex: number, field: keyof Answer, value: any) => {
        const newQs = [...questions];
        const answers = [...newQs[qIndex].answers];

        // Logic for Single Choice: Only one can be correct
        if (field === 'is_correct' && value === true && newQs[qIndex].type === 'single') {
            answers.forEach(a => a.is_correct = false);
        }

        answers[aIndex] = { ...answers[aIndex], [field]: value };
        newQs[qIndex].answers = answers;
        setQuestions(newQs);
        onChanged(true);
    };

    const addAnswer = (qIndex: number) => {
        const newQs = [...questions];
        newQs[qIndex].answers.push({
            text: '',
            is_correct: false,
            position: newQs[qIndex].answers.length
        });
        setQuestions(newQs);
        onChanged(true);
    };

    const deleteAnswer = (qIndex: number, aIndex: number) => {
        const newQs = [...questions];
        newQs[qIndex].answers.splice(aIndex, 1);
        setQuestions(newQs);
        onChanged(true);
    };

    const saveQuiz = async () => {
        setSaving(true);
        // We use a clone to update state with new IDs as we go
        const questionsToUpdate = [...questions];

        // VALIDATION PHASE
        for (let i = 0; i < questionsToUpdate.length; i++) {
            const q = questionsToUpdate[i];
            const correctCount = q.answers.filter(a => a.is_correct).length;

            if (q.type === 'multiple' && correctCount < 2) {
                alert(`Erreur Question ${i + 1}: Une question à "Choix Multiples" doit avoir au moins 2 bonnes réponses. Passez en "Choix Unique" ou cochez plus de réponses.`);
                setSaving(false);
                return;
            }

            if (q.type === 'single' && correctCount !== 1) {
                alert(`Erreur Question ${i + 1}: Une question à "Choix Unique" doit avoir exactement 1 bonne réponse.`);
                setSaving(false);
                return;
            }
        }

        for (let i = 0; i < questionsToUpdate.length; i++) {
            const q = questionsToUpdate[i];

            // 1. Prepare Question Payload
            const questionPayload: any = {
                lesson_id: lessonId,
                text: q.text,
                type: q.type,
                points: q.points,
                trigger_at: q.trigger_at, // Send to DB
                position: i
            };

            // Only include ID if it exists (for UPDATE). 
            // If ID is undefined, Supabase will INSERT.
            if (q.id) {
                questionPayload.id = q.id;
            }

            const { data: qData, error: qError } = await supabase
                .from('questions')
                .upsert(questionPayload)
                .select()
                .single();

            if (qError) {
                console.error("Error saving question FULL:", JSON.stringify(qError, null, 2));
                alert(`Erreur lors de la sauvegarde de la question ${i + 1}. Détails en console.`);
                setSaving(false);
                return;
            }

            const qId = qData.id;
            questionsToUpdate[i] = { ...q, id: qId }; // Update local state immediately

            // 2. Upsert Answers
            const answersToUpdate = [...q.answers];
            for (let j = 0; j < answersToUpdate.length; j++) {
                const a = answersToUpdate[j];

                const answerPayload: any = {
                    question_id: qId,
                    text: a.text,
                    is_correct: a.is_correct,
                    position: j
                };

                if (a.id) {
                    answerPayload.id = a.id;
                }

                const { data: aData, error: aError } = await supabase
                    .from('answers')
                    .upsert(answerPayload)
                    .select()
                    .single();

                if (aError) {
                    console.error("Error saving answer FULL:", JSON.stringify(aError, null, 2));
                } else {
                    answersToUpdate[j] = { ...a, id: aData.id };
                }
            }
            questionsToUpdate[i].answers = answersToUpdate;
        }

        setQuestions(questionsToUpdate);
        setSaving(false);
        onChanged(false);
        alert("Quiz sauvegardé avec succès !");
    };

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /> Chargement du quiz...</div>;

    return (
        <div className="space-y-6 mt-4 border-t pt-4">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800">Questions ({questions.length})</h4>
                <Button onClick={saveQuiz} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Sauvegarder le Quiz
                </Button>
            </div>

            {questions.map((q, qIndex) => (
                <Card key={qIndex} className="p-4 border border-slate-200 bg-slate-50/50">
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <Label className="text-xs text-slate-500 uppercase">Question {qIndex + 1}</Label>
                            <Input
                                value={q.text}
                                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                className="font-medium bg-white mt-1"
                                placeholder="Intitulé de la question..."
                            />
                        </div>
                        <div className="w-24">
                            <Label className="text-xs text-slate-500 uppercase">Timer (sec)</Label>
                            <Input
                                type="number"
                                value={q.trigger_at ?? ''}
                                onChange={(e) => updateQuestion(qIndex, 'trigger_at', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Fin"
                                className="bg-white mt-1 border-indigo-100 focus:border-indigo-500"
                                title="Temps en secondes pour apparition (Laisser vide pour la fin)"
                            />
                        </div>
                        <div className="w-24">
                            <Label className="text-xs text-slate-500 uppercase">Points</Label>
                            <Input
                                type="number"
                                value={q.points}
                                onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                                className="bg-white mt-1"
                            />
                        </div>
                        <div className="w-32">
                            <Label className="text-xs text-slate-500 uppercase">Type</Label>
                            <div className="flex bg-slate-200 rounded-md p-1 mt-1">
                                <button
                                    onClick={() => updateQuestion(qIndex, 'type', 'single')}
                                    className={`flex-1 text-xs py-1 rounded ${q.type === 'single' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500'}`}
                                >
                                    Unique
                                </button>
                                <button
                                    onClick={() => updateQuestion(qIndex, 'type', 'multiple')}
                                    className={`flex-1 text-xs py-1 rounded ${q.type === 'multiple' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500'}`}
                                >
                                    Multiple
                                </button>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="mt-6 text-red-500 hover:bg-red-50" onClick={() => deleteQuestion(qIndex)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                        {q.answers.map((a, aIndex) => (
                            <div key={aIndex} className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${q.type === 'multiple' ? 'rounded-md' : 'rounded-full'} ${a.is_correct ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:text-emerald-500'}`}
                                    onClick={() => updateAnswer(qIndex, aIndex, 'is_correct', !a.is_correct)}
                                    title={a.is_correct ? "Bonne réponse" : "Mauvaise réponse"}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                </Button>
                                <Input
                                    value={a.text}
                                    onChange={(e) => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                                    className={`h-8 text-sm ${a.is_correct ? 'border-emerald-200 bg-emerald-50/50' : 'bg-white'}`}
                                    placeholder={`Réponse ${String.fromCharCode(65 + aIndex)}`}
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => deleteAnswer(qIndex, aIndex)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="link" size="sm" onClick={() => addAnswer(qIndex)} className="text-indigo-600 h-8 px-0">
                            <Plus className="w-3 h-3 mr-1" /> Ajouter une réponse
                        </Button>
                    </div>
                </Card>
            ))}

            <Button variant="outline" className="w-full border-dashed" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" /> Ajouter une Question
            </Button>
        </div>
    );
}

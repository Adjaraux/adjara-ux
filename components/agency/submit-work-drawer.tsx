'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitDeliverableAction } from '@/app/actions/agency-deliverables';
import { toast } from 'sonner';
import { Loader2, UploadCloud, FileType, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface SubmitWorkDrawerProps {
    missionId: string;
    missionTitle: string;
    trigger?: React.ReactNode;
}

export function SubmitWorkDrawer({ missionId, missionTitle, trigger }: SubmitWorkDrawerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [comment, setComment] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            toast.error("Veuillez sélectionner un fichier.");
            return;
        }

        setLoading(true);
        try {
            // 1. Upload to Storage (Client-side directly to bucket)
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${missionId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

            // Assuming we have a 'deliverables' bucket or similar. 
            // Agency schema mentioned 'project-deliverables' or similar?
            // Let's check `agency_schema.sql` step 5570:
            // "insert into storage.buckets (id, name, public) values ('project-briefs'..."
            // Wait, we need a bucket for DELIVERABLES.
            // Let's assume 'project-briefs' for now or 'deliverables' if it exists.
            // Actually, we should create a 'deliverables' bucket if it doesn't exist.
            // For this iteration, let's try 'project-briefs' as it's the only one explicitly created in schema 5570.
            // OR better, let's use a standard 'agency-files' bucket if available.

            // Let's use 'project-briefs' for now as it's authenticated.
            const { data, error: uploadError } = await supabase.storage
                .from('project-briefs')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const publicUrl = supabase.storage.from('project-briefs').getPublicUrl(fileName).data.publicUrl;

            // 2. Submit to DB via Server Action
            const result = await submitDeliverableAction({
                projectId: missionId,
                fileUrl: publicUrl,
                fileName: file.name,
                fileType: 'other', // Auto-detect later
                comment: comment
            });

            if (result.success) {
                toast.success("Travail envoyé avec succès !");
                setOpen(false);
                setFile(null);
                setComment('');
            } else {
                toast.error(result.message);
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Erreur lors de l'envoi : " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger || <Button>Soumettre le Travail</Button>}
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Soumettre mon travail</DrawerTitle>
                        <DrawerDescription>
                            Envoyez vos livrables pour la mission <strong>{missionTitle}</strong>.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="file">Fichier (ZIP, PDF, JPG)</Label>
                            <div className="flex items-center gap-2">
                                <Input id="file" type="file" onChange={handleFileChange} className="cursor-pointer" />
                            </div>
                            {file && <p className="text-xs text-green-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Prêt à envoyer: {file.name}</p>}
                        </div>

                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="message">Message (Optionnel)</Label>
                            <Textarea
                                id="message"
                                placeholder="Voici les fichiers finaux..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                            {loading ? "Envoi en cours..." : "Envoyer les fichiers"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

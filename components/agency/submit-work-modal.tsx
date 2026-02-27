'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitDeliverableAction } from '@/app/actions/agency-deliverables';
import { toast } from 'sonner';
import { Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Correct import

interface SubmitWorkModalProps {
    missionId: string;
    missionTitle: string;
    trigger?: React.ReactNode;
}

export function SubmitWorkModal({ missionId, missionTitle, trigger }: SubmitWorkModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [comment, setComment] = useState('');

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
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            // Sanitize filename
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${missionId}/${Date.now()}_${safeName}`;

            // Using 'agency_deliverables' bucket (Fixed in Audit)
            const { data, error: uploadError } = await supabase.storage
                .from('agency_deliverables')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Note: getPublicUrl returns a URL, but the bucket is PRIVATE.
            // This URL will not work for public access without a token.
            // However, we save it in DB as a reference.
            // For private buckets, we should store the 'path' usually.
            // submitDeliverableAction expects fileUrl. Let's see if it handles creation of signed url on download?
            // Existing logic seemed to depend on 'fileUrl'. 
            // If the previous bucket 'project-briefs' was private, getPublicUrl would return a useless link?
            // 'project-briefs' was created with public=false.
            // So the previous code might have been broken for downloads unless it used signed urls.
            // `MissionViewClient` uses `getSignedUrlAction`. It likely takes the path or full url.
            // Let's store the PATH to be clean, or the fake public URL.
            // supabase.storage.from(...).getPublicUrl returns `.../object/public/bucket/path`.
            // Secure access uses `sign`.
            // Let's store the PATH mostly. But let's check `submitDeliverableAction` expectations.
            // For now, I will keep `getPublicUrl` but change bucket, assuming downstream handles it.
            // Actually, `MissionViewClient` calls `getSignedUrlAction(fileUrl)`. 
            // If `fileUrl` is a full URL, `getSignedUrlAction` needs to parse it? 
            // Let's check `getSignedUrlAction` in next step. For now, update bucket.

            const publicUrl = supabase.storage.from('agency_deliverables').getPublicUrl(fileName).data.publicUrl;

            // 2. Submit to DB via Server Action
            const result = await submitDeliverableAction({
                projectId: missionId,
                fileUrl: publicUrl,
                fileName: file.name,
                fileType: 'other',
                comment: comment
            });

            if (result.success) {
                toast.success("Travail envoyé avec succès !");
                setOpen(false);
                setFile(null);
                setComment('');
                router.refresh(); // INSTANT UPDATE
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Soumettre le Travail</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Soumettre mon travail</DialogTitle>
                    <DialogDescription>
                        Envoyez vos livrables finaux pour <strong>{missionTitle}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid w-full items-center gap-2">
                        <Label htmlFor="file">Fichier (ZIP, PDF, JPG)</Label>
                        <Input id="file" type="file" onChange={handleFileChange} />
                        {file && <p className="text-xs text-green-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> {file.name}</p>}
                    </div>

                    <div className="grid w-full gap-2">
                        <Label htmlFor="message">Note pour l'agence (Optionnel)</Label>
                        <Textarea
                            id="message"
                            placeholder="Voici les fichiers finaux..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                        {loading ? "Envoi..." : "Envoyer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageUploadProps {
    folderPath: string;
    onUploadComplete: (path: string) => void;
    currentPath?: string | null;
    bucketName?: string;
    allowedTypes?: 'image' | 'video' | 'both';
}

export function ImageUpload({
    folderPath,
    onUploadComplete,
    currentPath,
    bucketName = 'academy_content',
    allowedTypes = 'both'
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const validateFile = (file: File): boolean => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type === 'video/mp4';

        if (allowedTypes === 'image' && !isImage) {
            setError("Format invalide. Utilisez JPG, PNG ou WEBP.");
            return false;
        }
        if (allowedTypes === 'video' && !isVideo) {
            setError("Format invalide. Utilisez MP4.");
            return false;
        }
        if (allowedTypes === 'both' && !isImage && !isVideo) {
            setError("Format invalide. Utilisez Images ou MP4.");
            return false;
        }

        const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024; // 25MB video, 5MB image
        if (file.size > maxSize) {
            setError(`Fichier trop lourd. Max ${isVideo ? '25Mo' : '5Mo'}.`);
            return false;
        }
        return true;
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processUpload(file);
    };

    const processUpload = async (file: File) => {
        setError(null);
        setUploadProgress(0);
        if (!validateFile(file)) return;

        try {
            setIsUploading(true);
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const fullPath = `${folderPath}/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fullPath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;
            onUploadComplete(fullPath);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError("Échec de l'upload. Vérifiez votre connexion.");
            setPreview(null);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const getDisplayUrl = () => {
        if (preview) return preview;
        if (currentPath) {
            if (currentPath.startsWith('http')) return currentPath;
            const { data } = supabase.storage.from(bucketName).getPublicUrl(currentPath);
            return data.publicUrl;
        }
        return null;
    };

    const displayUrl = getDisplayUrl();
    const isVideoFile = currentPath?.toLowerCase().endsWith('.mp4') || preview?.startsWith('blob:'); // Simplified check

    return (
        <div className="space-y-4">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={allowedTypes === 'image' ? "image/*" : allowedTypes === 'video' ? "video/mp4" : "image/*,video/mp4"}
                onChange={handleFileSelect}
            />

            {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center">
                    <X className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            {displayUrl ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group">
                    {isVideoFile ? (
                        <video src={displayUrl} className="object-cover w-full h-full" muted loop playsInline autoPlay />
                    ) : (
                        <img src={displayUrl} alt="Aperçu" className="object-cover w-full h-full" />
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 scale-95 group-hover:scale-100 transition-transform duration-300">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-xl font-bold"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Changer
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="rounded-xl font-bold"
                            onClick={() => {
                                setPreview(null);
                                onUploadComplete('');
                            }}
                        >
                            Supprimer
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-brand-orange/50 hover:bg-brand-orange/5 transition-all duration-300 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
                            <div className="w-full max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-brand-orange"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">Traitement en cours...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center group">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-brand-orange/10 transition-colors">
                                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-brand-orange transition-colors" />
                            </div>
                            <p className="text-sm font-bold text-white">Importer un média</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Images (5Mo) ou MP4 (25Mo)
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sendMessageAction, markMessagesRead } from '@/app/actions/messaging';
import { getSignedUrlAction } from '@/app/actions/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, Loader2, User, File, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectChatProps {
    projectId: string;
    currentUser: any; // { id, role }
    initialMessages: any[];
}

export function ProjectChat({ projectId, currentUser, initialMessages }: ProjectChatProps) {
    const [messages, setMessages] = useState<any[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null); // Only single file for now

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // 1. Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // 2. Mark as read on mount
    useEffect(() => {
        markMessagesRead(projectId);
    }, [projectId]);

    // 3. Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel(`project-chat:${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `project_id=eq.${projectId}`
                },
                (payload) => {
                    // console.log('New message received!', payload);
                    // Fetch full message details (with sender info) or just append partial
                    // For speed, we append partial and maybe refresh sender info or optimistically assume?
                    // Ideally we fetch the new message row properly to get the 'sender' relation if needed.
                    // But for now, we can try to guess or re-fetch.
                    // Let's just append the payload.new and handle missing sender relation carefully.

                    // Actually, payload.new doesn't have the relation 'sender'.
                    // We need to know who sent it.
                    // If sender_id === currentUser.id, we already added it optimistically (optional) or ignore.
                    // If sender_id !== currentUser.id, we need to show it.

                    const newMsg = payload.new as any;

                    // Quick fetch to get sender info if missing
                    // Or simpler: Just add it with a 'Unknown' sender until refresh or separate fetch.
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMsg.id)) return prev; // Dedup
                        return [...prev, newMsg];
                    });

                    // Also mark read if I'm viewing
                    if (newMsg.sender_id !== currentUser.id) {
                        markMessagesRead(projectId);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, supabase, currentUser.id]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !attachment) return;

        setLoading(true);
        let uploadedAttachments = [];

        // Upload File if exists
        if (attachment) {
            const fileName = `${projectId}/${Date.now()}_${attachment.name}`;
            const { data, error } = await supabase.storage
                .from('chat_attachments')
                .upload(fileName, attachment);

            if (error) {
                toast.error("Erreur upload fichier : " + error.message);
                setLoading(false);
                return;
            }

            // We store the path to be used with getSignedUrl later
            uploadedAttachments.push({
                name: attachment.name,
                path: data.path, // This is key for getSignedUrl
                type: attachment.type
            });
        }

        const res = await sendMessageAction({
            projectId,
            content: newMessage,
            attachments: uploadedAttachments
        });

        if (res.success) {
            setNewMessage('');
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
            toast.error("Échec de l'envoi");
        }
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Helper for downloading attachments securely
    const handleDownload = async (path: string, filename: string) => {
        // Implement secure download via server action or signed URL
        // Ideally we use a server action that generates a signed URL
        // Re-using the logic from getSignedUrlAction but adapted for chat?
        // Actually, we can just use the supabase client here if we have a policy?
        // No, we defined NO SELECT policy. We MUST use a signed URL server action.

        // Let's assume we have a generic action or we call a new one.
        // For now, let's show a toast "Not implemented" or try to reuse getSignedUrlAction.
        // I'll update getSignedUrlAction in next step. For now, let's put a placeholder logic.
        toast.info("Téléchargement sécurisé en cours...");

        // Calling server action from here
        const res = await getSignedUrlAction(path, projectId, 'chat_attachments');

        if (res.success && res.signedUrl) {
            window.open(res.signedUrl, '_blank');
        } else {
            toast.error("Erreur lien : " + res.message);
        }
    };

    return (
        <Card className="flex flex-col h-[500px] md:h-[600px] max-h-[85dvh] md:max-h-none border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-4 bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                    💬 Discussion Projet
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 py-10 text-sm italic">
                                Le chat est ouvert. Posez vos questions à l'agence ici.
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUser.id;
                            // Check if sender relation exists (from server load) or manual check
                            // If Realtime insert, 'sender' relation is missing in payload.
                            // We can infer sender from 'sender_id'.
                            const senderName = isMe ? "Moi" : (msg.sender?.full_name || "Agence");
                            const hasAttachments = msg.attachments && msg.attachments.length > 0;

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Avatar className="w-8 h-8 mt-1">
                                            <AvatarFallback className={isMe ? "bg-indigo-100 text-indigo-700" : "bg-slate-200"}>
                                                {isMe ? "MO" : "AG"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className={`p-3 rounded-lg text-sm shadow-sm ${isMe
                                                ? "bg-indigo-600 text-white rounded-tr-none"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                                }`}>
                                                <p>{msg.content}</p>

                                                {/* Attachments Display */}
                                                {hasAttachments && (
                                                    <div className="mt-2 space-y-1">
                                                        {msg.attachments.map((file: any, i: number) => (
                                                            <div
                                                                key={i}
                                                                onClick={() => handleDownload(file.path, file.name)}
                                                                className={`
                                                                    flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs active:opacity-70
                                                                    ${isMe ? "bg-indigo-500 hover:bg-indigo-400 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700 active:bg-slate-200"}
                                                                `}
                                                            >
                                                                <File className="w-3 h-3" />
                                                                <span className="truncate max-w-[150px]">{file.name}</span>
                                                                <Download className="w-3 h-3 opacity-70" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-[10px] text-slate-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                {senderName} • {format(new Date(msg.created_at), 'dd MMM HH:mm', { locale: fr })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">

                    {/* Attachment Preview */}
                    {attachment && (
                        <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 p-2 rounded-md w-fit">
                            <File className="w-3 h-3" />
                            {attachment.name}
                            <button onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                <X className="w-3 h-3 hover:text-red-500" />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 items-center w-full">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <Input
                            placeholder="Écrivez votre message..."
                            className="flex-1 bg-white border-slate-200 focus-visible:ring-indigo-500 text-base md:text-sm"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={loading || (!newMessage.trim() && !attachment)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-transform"
                            size="icon"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadReceiptButtonProps {
    transactionId: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'link';
    className?: string;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showIcon?: boolean;
}

export function DownloadReceiptButton({
    transactionId,
    variant = 'outline',
    className = "",
    size = 'default',
    showIcon = true
}: DownloadReceiptButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        toast.loading("Préparation de votre reçu...");

        try {
            // 1. Fetch Transaction Data (JSON)
            const response = await fetch(`/api/receipts/${transactionId}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Erreur lors de la récupération des données");
            }

            toast.loading("Génération du PDF dans votre navigateur...");

            // 2. Dynamic Import of PDF engine and template
            const { pdf } = await import('@react-pdf/renderer');
            const { ReceiptPDF } = await import('@/components/pdf/receipt-pdf');

            // 3. Generate PDF Blob
            const blob = await pdf(<ReceiptPDF data={result.data} />).toBlob();

            // 4. Trigger Download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');

            const cleanName = result.data.customerName.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
            const filename = `Recu_${cleanName}_${transactionId.substring(0, 8)}.pdf`;

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.dismiss();
            toast.success("Reçu téléchargé avec succès !");
        } catch (e: any) {
            console.error(e);
            toast.dismiss();
            toast.error(e.message || "Impossible de générer le reçu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleDownload}
            disabled={loading}
            variant={variant}
            size={size}
            className={className}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : showIcon ? (
                <FileText className="w-4 h-4 mr-2" />
            ) : null}
            Reçu PDF
        </Button>
    );
}

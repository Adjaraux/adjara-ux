'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, ShoppingBag } from 'lucide-react';
import { DownloadReceiptButton } from '@/components/client/download-receipt-button';

export default function PurchasesPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchHistory() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('agency_transactions')
                .select('*')
                .eq('user_id', user.id)
                .is('project_id', null) // Only packs (formations)
                .order('created_at', { ascending: false });

            if (!error) setTransactions(data || []);
            setLoading(false);
        }
        fetchHistory();
    }, [supabase]);

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Historique des Achats 💳</h1>
                <p className="text-slate-500">Retrouvez ici vos factures de formation et détails de vos packs.</p>
            </div>

            {transactions.length === 0 ? (
                <Card className="border-dashed border-2 bg-slate-50/50">
                    <CardContent className="py-12 text-center">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Aucun achat pour le moment</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            Dès que vous souscrivez à un pack de formation, vos factures apparaîtront ici.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <Card key={tx.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">
                                                Pack {tx.metadata?.packType?.toUpperCase() || 'FORMATION'}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                Réglé le {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-slate-900">
                                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: tx.currency }).format(tx.amount)}
                                            </div>
                                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 uppercase text-[10px] tracking-widest">
                                                {tx.status === 'success' ? 'Payé' : tx.status}
                                            </Badge>
                                        </div>

                                        <DownloadReceiptButton
                                            transactionId={tx.id}
                                            className="h-10 px-4"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}


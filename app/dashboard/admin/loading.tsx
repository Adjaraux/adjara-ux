'use client';

import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
            </div>

            {/* Stats Row Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 bg-slate-100 rounded-lg animate-pulse" />
                            <div className="h-4 w-12 bg-slate-50 rounded animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                            <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-16 bg-slate-50 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Loader for extra feedback */}
            <div className="fixed bottom-8 right-8 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 text-slate-500 text-sm font-medium z-50">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                Chargement...
            </div>
        </div>
    );
}

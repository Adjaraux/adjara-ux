import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDashboardLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-12 w-40 rounded-lg" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 space-y-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 flex justify-between items-center">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-6 w-1/2" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <Skeleton className="h-8 w-32" />
                    <div className="bg-slate-900 rounded-xl p-6 space-y-6">
                        <Skeleton className="h-6 w-3/4 bg-slate-800" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="h-6 w-6 rounded-full bg-slate-800 shrink-0" />
                                    <Skeleton className="h-4 w-full bg-slate-800" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

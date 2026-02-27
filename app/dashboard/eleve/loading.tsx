import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Banner Skeleton */}
            <div className="h-48 w-full rounded-2xl bg-white shadow-sm border border-slate-100 p-8 flex items-end overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-20 -mt-20 opacity-50" />
                <div className="relative z-10 space-y-4 w-full">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-64" />
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-40 rounded-lg" />
                        <Skeleton className="h-10 w-40 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-4">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

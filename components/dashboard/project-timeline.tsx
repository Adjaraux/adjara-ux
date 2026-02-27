import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Milestone } from '@/hooks/use-agency-logic';

interface ProjectTimelineProps {
    milestones: Milestone[];
}

export function ProjectTimeline({ milestones }: ProjectTimelineProps) {
    if (!milestones || milestones.length === 0) {
        return <div className="text-slate-500 italic text-sm">Aucune étape définie pour ce projet.</div>;
    }

    return (
        <div className="relative">
            {/* The Line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200"></div>

            <div className="space-y-8">
                {milestones.map((milestone, index) => {
                    const isCompleted = milestone.status === 'completed';
                    const isPending = milestone.status === 'pending';
                    const isNext = isPending && (index === 0 || milestones[index - 1].status === 'completed');

                    return (
                        <div key={milestone.id} className="relative flex items-start gap-4">
                            {/* Icon Bubble */}
                            <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : isNext
                                        ? 'bg-white border-emerald-500 text-emerald-600 animate-pulse'
                                        : 'bg-slate-100 text-slate-400'
                                }`}>
                                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-5 h-5" />}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 pt-1 ${isNext ? 'opacity-100' : 'opacity-80'}`}>
                                <h4 className={`font-bold text-lg ${isCompleted ? 'text-emerald-900' : isNext ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {milestone.title}
                                </h4>
                                <div className="flex items-center gap-4 mt-1 text-sm">
                                    {isCompleted && milestone.completed_at && (
                                        <span className="text-emerald-600 font-medium">
                                            Terminé le {new Date(milestone.completed_at).toLocaleDateString()}
                                        </span>
                                    )}
                                    {isPending && milestone.due_date && (
                                        <span className="text-slate-500 flex items-center">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            Prévu pour le {new Date(milestone.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

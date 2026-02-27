import { useState, useEffect } from 'react';
import { Lock, PlayCircle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Course } from '@/hooks/use-academy-logic';

interface CourseCardProps {
    course: Course & { isLocked: boolean };
}

export function CourseCard({ course }: CourseCardProps) {
    const imageUrl = course.thumbnail_url;

    return (
        <div className={`group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-md ${course.isLocked ? 'opacity-75 grayscale' : 'hover:-translate-y-1'}`}>

            {/* Thumbnail Area */}
            <div className="h-40 bg-slate-100 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${course.isLocked ? 'bg-slate-100' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                        {course.isLocked ? (
                            <Lock className="w-8 h-8 text-slate-300" />
                        ) : (
                            <PlayCircle className="w-8 h-8 text-indigo-200" />
                        )}
                    </div>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-3 right-3">
                    {course.isLocked ? (
                        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            Verrouillé
                        </span>
                    ) : (
                        <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                            Accessible
                        </span>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5">
                <div className="mb-3">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${course.category === 'tronc_commun' ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {course.category === 'tronc_commun' ? 'La Base Essentielle : Le Graphisme' : 'Spécialité'}
                    </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2 min-h-[3.5rem]">
                    {course.title}
                </h3>

                <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">
                    {course.description}
                </p>

                {/* Footer / Action */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    {course.isLocked ? (
                        <div className="flex items-center text-xs text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            Dispo. mois {course.unlock_at_month}
                        </div>
                    ) : (
                        <div className="w-full">
                            {course.progressPercent !== undefined && course.progressPercent > 0 && course.progressPercent < 100 && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                                        <span>Progression</span>
                                        <span>{course.progressPercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full"
                                            style={{ width: `${course.progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <Link href={`/dashboard/eleve/cours/${course.slug}`} className="w-full block">
                                <Button
                                    className={`w-full font-semibold h-10 rounded-lg group-hover:shadow-md transition-all ${course.progressPercent === 100
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                >
                                    {course.progressPercent === 100 ? "Revoir le cours" : (
                                        course.progressPercent && course.progressPercent > 0 ? "Reprendre le cours" : "Commencer le cours"
                                    )}
                                </Button>
                            </Link>

                            {course.progressPercent === 100 && (
                                <div className="flex justify-center mt-2">
                                    <span className="text-[10px] items-center flex gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <CheckCircle className="w-3 h-3" />
                                        Terminé
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

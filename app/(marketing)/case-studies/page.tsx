import Link from 'next/link';
import Image from 'next/image';
import { getAllCaseStudies } from '@/lib/markdown';
import { ArrowRight, Briefcase } from 'lucide-react';

export const metadata = {
    title: "Études de Cas | Adjara UX",
    description: "Découvrez nos succès stratégiques en Design, Tech et Transformation Digitale."
};

export default function CaseStudiesPage() {
    const studies = getAllCaseStudies();

    return (
        <div className="min-h-screen bg-obsidian text-white pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-black uppercase tracking-widest mb-4">
                        <Briefcase className="w-3 h-3" />
                        Success Stories
                    </div>
                    <h1 className="text-5xl md:text-7xl font-outfit font-black tracking-tighter mb-6">
                        Expertise <span className="text-brand-orange">Démontrée</span>
                    </h1>
                    <p className="text-slate-400 text-xl max-w-2xl leading-relaxed">
                        Chaque projet est une équation résolue. Découvrez comment nous transformons les défis complexes en expériences fluides et rentables.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {studies.map((study) => (
                        <Link
                            key={study.slug}
                            href={`/case-studies/${study.slug}`}
                            className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-brand-orange/50 transition-all duration-500"
                        >
                            <div className="aspect-video relative overflow-hidden">
                                <div className="absolute inset-0 bg-brand-orange/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                                <div className="p-12 flex items-center justify-center h-full bg-slate-900 group-hover:scale-105 transition-transform duration-700">
                                    {/* Placeholder for real image */}
                                    <Briefcase className="w-16 h-16 text-white/10 group-hover:text-brand-orange/40 transition-colors" />
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-3 text-brand-orange text-[10px] font-black uppercase tracking-widest mb-3">
                                    <span>{study.category}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span>{study.client}</span>
                                </div>
                                <h2 className="text-2xl font-outfit font-bold tracking-tight mb-4 group-hover:text-brand-orange transition-colors">
                                    {study.title}
                                </h2>
                                <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                                    {study.description}
                                </p>
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    Voir l'étude de cas
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

import { getCaseStudyBySlug } from '@/lib/markdown';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const study = getCaseStudyBySlug(slug);
    if (!study) return {};
    return {
        title: `${study.title} | Adjara UX`,
        description: study.description
    };
}

export default async function CaseStudyDetail({ params }: Props) {
    const { slug } = await params;
    const study = getCaseStudyBySlug(slug);

    if (!study) notFound();

    return (
        <article className="min-h-screen bg-obsidian text-white pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <Link
                    href="/case-studies"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux études de cas
                </Link>

                <div className="mb-12">
                    <div className="flex items-center gap-3 text-brand-orange text-xs font-black uppercase tracking-[0.2em] mb-4">
                        <span>{study.category}</span>
                        <ChevronRight className="w-3 h-3 text-white/20" />
                        <span>{study.client}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-outfit font-black tracking-tighter mb-8 leading-tight">
                        {study.title}
                    </h1>
                </div>

                {/* Strategy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                        <h3 className="text-brand-orange text-[10px] font-black uppercase tracking-widest mb-4">Challenge</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{study.challenge}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                        <h3 className="text-brand-orange text-[10px] font-black uppercase tracking-widest mb-4">Solution</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{study.solution}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl border-brand-orange/20 shadow-laser-sm">
                        <h3 className="text-brand-orange text-[10px] font-black uppercase tracking-widest mb-4">Résultats</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{study.results}</p>
                    </div>
                </div>

                <div className="prose prose-invert prose-brand max-w-none">
                    <div className="text-slate-300 leading-loose text-lg whitespace-pre-wrap font-inter">
                        {study.content}
                    </div>
                </div>

                <div className="mt-20 pt-12 border-t border-white/5">
                    <div className="bg-brand-orange/10 border border-brand-orange/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Prêt pour votre propre succès ?</h2>
                            <p className="text-slate-400 text-sm">Discutons de la manière dont Adjara UX peut transformer votre vision.</p>
                        </div>
                        <Link href="/contact">
                            <button className="bg-brand-orange text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-laser transition-transform hover:scale-105 active:scale-95">
                                Démarrer un projet
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}

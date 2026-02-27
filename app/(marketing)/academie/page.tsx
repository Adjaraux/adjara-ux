import { GraduationCap, BookOpen, Target, Sparkles, ArrowRight, CheckCircle, Play, Users, Award, PenTool, Shirt, Monitor, Cpu } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import { getYouTubeId } from '@/lib/youtube';

export default async function AcademiePage() {
    const supabase = await createClient();
    let youtubeId = 'dQw4w9WgXcQ'; // Fallback

    const { data } = await supabase
        .from('site_configs')
        .select('value')
        .eq('key', 'youtube_id_academy')
        .single();

    if (data?.value) {
        const id = getYouTubeId(data.value);
        if (id) youtubeId = id;
    }

    const specialties = [
        {
            title: "Textile & Personnalisation",
            icon: Shirt,
            description: "Maîtrisez l'art du flocage, de la broderie 3D et du design textile premium.",
            color: "text-indigo-600",
            bgColor: "bg-indigo-50"
        },
        {
            title: "Design & Développement",
            icon: Monitor,
            description: "De l'UI/UX stratégique au développement Full-Stack avec les technologies de pointe.",
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Gravure & Découpe",
            icon: Cpu,
            description: "Ingénierie de précision : Laser, CNC et signalétique haute définition.",
            color: "text-amber-600",
            bgColor: "bg-amber-50"
        }
    ];

    return (
        <div className="min-h-screen bg-[#05080f] text-white pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Hero */}
                <div className="mb-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-[10px] font-bold uppercase tracking-widest mb-6">
                        L'Élite de la Formation Tech & Design
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-white">
                        L'Académie <span className="text-brand-orange">Adjara UX.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Un parcours d'excellence structuré pour transformer votre passion en une expertise métier incontestable.
                    </p>
                </div>

                {/* Video Section */}
                <div className="mb-32 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7">
                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 group">
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=1&rel=0`}
                                    title="Academy Overview"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="inline-flex items-center gap-2 text-brand-orange font-bold uppercase tracking-widest text-[10px] mb-6">
                                <Play className="w-3 h-3 fill-current" /> L'excellence en mouvement
                            </div>
                            <h2 className="text-4xl font-bold mb-6 tracking-tighter leading-tight text-white">
                                Immersion dans l'écosystème Académie
                            </h2>
                            <p className="text-slate-400 leading-relaxed text-lg">
                                Découvrez comment nos programmes forgent les futurs leaders technologiques à travers une immersion totale.
                            </p>
                            <div className="mt-8 h-1 w-20 bg-brand-orange rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Tronc Commun Section */}
                <div className="mb-32">
                    <div className="flex flex-col md:flex-row gap-16 items-center bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-orange/5 blur-[100px] pointer-events-none" />

                        <div className="flex-1 space-y-8 relative z-10">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="inline-flex items-center gap-2 text-brand-orange font-bold text-xs tracking-widest uppercase">
                                    <Sparkles className="w-4 h-4" /> Palier 1
                                </div>
                                <div className="px-3 py-1 bg-brand-orange text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-laser-sm">
                                    7 Jours d'essai gratuit
                                </div>
                            </div>

                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-white">Le Tronc <br /><span className="text-white/20">Commun.</span></h2>

                            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                                La base fondamentale de tout créateur. Maîtrisez la précision absolue du tracé et la rigueur technique avant de choisir votre voie d'expertise.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link href="/auth">
                                    <Button className="bg-brand-orange text-white hover:bg-brand-orange/90 px-8 py-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-brand-orange/20">
                                        Essayer gratuitement
                                    </Button>
                                </Link>
                                <ul className="flex flex-col justify-center space-y-1">
                                    {["Logiciels Vectoriels", "Précision du tracé", "Rigueur Académique"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            <CheckCircle className="w-3 h-3 text-brand-orange" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="w-full md:w-80 aspect-square rounded-[3rem] bg-white/5 border border-white/5 flex items-center justify-center group shrink-0 shadow-inner">
                            <PenTool className="w-32 h-32 text-brand-orange opacity-20 group-hover:opacity-100 transition-all duration-700 scale-90 group-hover:scale-110" />
                        </div>
                    </div>
                </div>

                {/* Specialties Grid */}
                <div className="mb-32 text-center">
                    <div className="inline-flex items-center gap-2 text-brand-orange font-bold text-xs tracking-widest uppercase mb-8">
                        Palier 2 : L'Expertise Métier
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-16 text-white">Choisissez votre <span className="text-brand-orange">Destinée.</span></h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {specialties.map((spec, idx) => (
                            <div key={idx} className="group p-12 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-brand-orange/30 hover:shadow-2xl hover:shadow-brand-orange/5 transition-all duration-500 text-left backdrop-blur-sm">
                                <div className={`w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300`}>
                                    <spec.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 tracking-tight group-hover:text-brand-orange transition-colors text-white">{spec.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    {spec.description}
                                </p>
                                <div className="h-1 w-12 bg-white/10 group-hover:w-full group-hover:bg-brand-orange transition-all duration-500 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="relative rounded-[3rem] bg-white/5 border border-white/10 text-white p-12 md:p-20 overflow-hidden shadow-2xl backdrop-blur-md">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 blur-[120px] pointer-events-none" />

                    <div className="md:flex gap-16 items-center relative z-10 text-center md:text-left">
                        <div className="flex-1 mb-12 md:mb-0">
                            <h2 className="text-4xl font-black tracking-tighter mb-8 italic uppercase text-white">Structure de l'Offre.</h2>
                            <div className="grid gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-slate-400 text-sm italic">Accès au Tronc Commun + 1 Spécialité au choix.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-brand-orange/20 border border-brand-orange/30">
                                    <p className="text-white text-sm font-bold">Master Academy : Accès Total aux 3 spécialités.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-slate-400 mb-8 max-w-sm text-lg leading-relaxed">
                                Prêt à forger votre avenir avec la précision Adjara UX ?
                            </p>
                            <Link href="/pricing">
                                <Button size="lg" className="bg-brand-orange hover:bg-brand-orange/90 text-white px-12 py-8 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-orange/20 transition-all hover:scale-105 active:scale-95 group">
                                    Voir les Tarifs <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

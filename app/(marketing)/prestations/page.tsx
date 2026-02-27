import { Palette, Code, Brain, ArrowRight, Shirt, Scissors, Monitor, Globe, FileImage, Cpu, Type, Maximize, Play } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import { getYouTubeId } from '@/lib/youtube';

export default async function PrestationsPage() {
    const supabase = await createClient();
    let youtubeId = 'dQw4w9WgXcQ'; // Fallback

    const { data } = await supabase
        .from('site_configs')
        .select('value')
        .eq('key', 'youtube_id_prestations')
        .single();

    if (data?.value) {
        const id = getYouTubeId(data.value);
        if (id) youtubeId = id;
    }

    const pillars = [
        {
            id: 'textile-perso',
            title: "Textile & Personnalisation",
            icon: Shirt,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50",
            services: [
                "T-shirt & Polo (Flocage, Broderie)",
                "Casquette & Chapeau (Broderie 3D)",
                "Tissus & Découpe sur-mesure",
                "Porte-clés & Goodies",
                "Objets publicitaires (Mugs, Stylos)"
            ],
            path: "cat=textile-perso"
        },
        {
            id: 'design-dev',
            title: "Design & Développement",
            icon: Monitor,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            services: [
                "Sites Web & SaaS (Next.js, E-commerce)",
                "UI/UX Design stratégique (Figma)",
                "Identité Visuelle & Graphisme Print",
                "Automatisation & Solutions IA"
            ],
            path: "cat=design-dev"
        },
        {
            id: 'engraving',
            title: "Gravure & Découpe",
            icon: Cpu,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
            services: [
                "Enseignes Lumineuses & Signalétique",
                "Découpe Laser (Bois, Plexiglas, Métal)",
                "Gravure technique & CNC",
                "Objets décoratifs sur-mesure"
            ],
            path: "cat=engraving"
        }
    ];

    return (
        <div className="min-h-screen bg-[#05080f] text-white pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Hero Section */}
                <div className="mb-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-[10px] font-bold uppercase tracking-widest mb-6">
                        Expertise & Précision
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                        Nos <span className="text-brand-orange">Piliers Métiers.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Du textile à la haute technologie, nous transformons vos ambitions en produits tangibles et expériences digitales d'exception.
                    </p>
                </div>

                {/* Video Section */}
                <div className="mb-32 max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7 order-2 lg:order-1">
                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 group">
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=1&rel=0`}
                                    title="Prestations Overview"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-5 order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 text-brand-orange font-bold uppercase tracking-widest text-[10px] mb-6">
                                <Play className="w-3 h-3 fill-current" /> Savoir-faire Expertise
                            </div>
                            <h2 className="text-4xl font-bold mb-6 tracking-tighter leading-tight text-white">
                                Notre ingénierie en mouvement
                            </h2>
                            <p className="text-slate-400 leading-relaxed text-lg">
                                De la conception UI/UX à la réalisation technique de pointe, découvrez comment nous fusionnons l'artisanat textile et le digital premium.
                            </p>
                            <div className="mt-8 h-1 w-20 bg-brand-orange rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {pillars.map((pillar) => (
                        <div key={pillar.id} id={pillar.id} className="group relative p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-brand-orange/30 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-brand-orange/5 transition-all duration-500 overflow-hidden backdrop-blur-sm">
                            <div className={`w-14 h-14 bg-brand-orange/10 text-brand-orange rounded-xl flex items-center justify-center mb-8 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300 shadow-sm`}>
                                <pillar.icon size={28} />
                            </div>

                            <h3 className="text-2xl font-bold mb-6 tracking-tight text-white group-hover:text-brand-orange transition-colors">
                                {pillar.title}
                            </h3>

                            <ul className="space-y-4 mb-10">
                                {pillar.services.map((service, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-slate-400 text-sm">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0 shadow-laser-sm" />
                                        {service}
                                    </li>
                                ))}
                            </ul>

                            <Link href={`/dashboard/client/projects/new?${pillar.path}`}>
                                <Button className="w-full bg-white/5 border border-white/10 hover:bg-brand-orange text-white py-6 rounded-2xl group transition-all font-bold uppercase tracking-widest text-[10px]">
                                    Démarrer un projet
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="relative rounded-[3rem] bg-white/5 border border-white/10 text-white p-16 text-center overflow-hidden shadow-2xl backdrop-blur-md">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 blur-[120px] pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-4xl font-black mb-6 tracking-tighter uppercase italic">Votre vision n'a pas de limite.</h2>
                        <p className="text-slate-400 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                            Nous concevons des solutions hybrides qui marient l'artisanat et le digital. Discutons de votre prochain challenge.
                        </p>
                        <Link href="/contact">
                            <Button size="lg" className="bg-brand-orange hover:bg-brand-orange/90 text-white px-12 py-8 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-orange/20 transition-all hover:scale-105 active:scale-95">
                                Consulter un expert
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

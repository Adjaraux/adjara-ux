'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PORTFOLIO_POHLS,
    SUB_CATEGORIES_MAP,
    ProjectPohl,
    PortfolioProject
} from '@/lib/portfolio-data';
import { Button } from '@/components/ui/button';
import {
    ArrowUpRight,
    Globe,
    ChevronRight,
    Search,
    Smartphone as AppStoreIcon,
    Search as PlayStoreIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';

export function RealisationsClient() {
    const [projects, setProjects] = useState<PortfolioProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPohl, setSelectedPohl] = useState<string>('textile-perso');
    const [selectedCat, setSelectedCat] = useState<string>('all');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('portfolio_projects')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Map snake_case to camelCase
            const mappedData = data.map((p: any) => ({
                ...p,
                imageUrl: p.image_url,
                videoUrl: p.video_url,
                wizardPath: p.wizard_path,
                techSpecs: p.tech_specs,
                sortOrder: p.sort_order,
            }));
            setProjects(mappedData as any);
        }
        setIsLoading(false);
    };

    const filteredProjects = projects.filter(project => {
        const pohlMatch = selectedPohl === 'all' || project.pohl === selectedPohl;
        const catMatch = selectedCat === 'all' || project.category === selectedCat;
        return pohlMatch && catMatch;
    });

    return (
        <div className="min-h-screen bg-obsidian text-white pt-20">
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row">
                {/* Sidebar (Sticky Left) */}
                <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] w-full lg:w-80 bg-obsidian/50 backdrop-blur-xl border-r border-white/5 z-40 hidden lg:block overflow-y-auto custom-scrollbar self-start">
                    <div className="p-8 space-y-10">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-4">Filtrer par expertise</h2>
                            <nav className="space-y-2">
                                {PORTFOLIO_POHLS.filter(p => p.id !== 'all').map((pohl) => (
                                    <div key={pohl.id} className="space-y-1">
                                        <button
                                            onClick={() => { setSelectedPohl(pohl.id); setSelectedCat('all'); }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${selectedPohl === pohl.id ? 'bg-brand-orange/10 text-brand-orange' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-sm font-bold">{pohl.label}</span>
                                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedPohl === pohl.id ? 'rotate-90' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {selectedPohl === pohl.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden pl-4"
                                                >
                                                    {SUB_CATEGORIES_MAP[pohl.id as ProjectPohl]?.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => setSelectedCat(cat.id)}
                                                            className={`w-full text-left px-4 py-2 rounded-lg text-xs font-medium transition-colors ${selectedCat === cat.id ? 'text-white bg-white/5' : 'text-slate-500 hover:text-white'
                                                                }`}
                                                        >
                                                            {cat.label}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-h-screen px-6 md:px-12 py-12">
                    <div className="max-w-6xl mx-auto">
                        {/* Header Info */}
                        <div className="mb-12">
                            <h1 className="text-5xl md:text-7xl font-outfit font-black tracking-tighter mb-4">
                                {PORTFOLIO_POHLS.find(p => p.id === selectedPohl)?.label}
                            </h1>
                            <p className="text-slate-400 font-inter max-w-xl">
                                {`Découvrez nos réalisations d'exception en ${PORTFOLIO_POHLS.find(p => p.id === selectedPohl)?.label}.`}
                            </p>
                        </div>

                        {/* Adaptive Grid/List */}
                        <div className={selectedPohl === 'design-dev' ? "space-y-16" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                            <AnimatePresence mode="popLayout">
                                {filteredProjects.map((project) => (
                                    <motion.div
                                        key={project.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        {project.pohl === 'design-dev' ? (
                                            <DigitalProjectCard project={project} />
                                        ) : (
                                            <CraftProjectCard project={project} />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Empty State */}
                        {filteredProjects.length === 0 && (
                            <div className="py-32 text-center border border-dashed border-white/5 rounded-[2rem]">
                                <Search className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-600">Aucun projet trouvé</h3>
                                <p className="text-slate-700 mt-2">Affinez vos filtres pour explorer nos créations.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function CraftProjectCard({ project }: { project: PortfolioProject }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isLongPress, setIsLongPress] = useState(false);
    let timer: NodeJS.Timeout;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left) / width) * 100;
        const y = ((e.pageY - top) / height) * 100;
        setMousePos({ x, y });
    };

    const startPress = () => timer = setTimeout(() => setIsLongPress(true), 500);
    const endPress = () => { clearTimeout(timer); setIsLongPress(false); };

    return (
        <div
            className="group block space-y-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={startPress}
            onTouchEnd={endPress}
        >
            <div className="relative aspect-square md:aspect-[4/5] overflow-hidden rounded-xl bg-slate-900 border border-white/5 transition-all duration-500 group-hover:border-brand-orange/30 group-hover:shadow-2xl">
                <motion.div
                    animate={{
                        scale: isLongPress ? 1.5 : (isHovered ? 1.05 : 1),
                        x: isLongPress ? `${50 - mousePos.x}%` : 0,
                        y: isLongPress ? `${50 - mousePos.y}%` : 0
                    }}
                    className="relative w-full h-full transition-transform duration-700"
                >
                    <Image
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </motion.div>

                {/* Loupe Laser Overlay (Desktop) */}
                {isHovered && !isLongPress && (
                    <div
                        className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            backgroundImage: `url(${project.imageUrl})`,
                            backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                            backgroundSize: '300%',
                            backgroundRepeat: 'no-repeat',
                            maskImage: 'radial-gradient(circle 100px at center, black 100%, transparent 100%)',
                            WebkitMaskImage: `radial-gradient(circle 100px at ${mousePos.x}% ${mousePos.y}%, black 0%, transparent 80%)`
                        }}
                    />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-60" />

                <Link href={project.wizardPath} className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <Button size="icon" className="bg-brand-orange text-white rounded-full h-12 w-12 shadow-laser">
                        <ArrowUpRight className="w-5 h-5" />
                    </Button>
                </Link>
            </div>

            <div className="px-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black tracking-widest text-brand-orange uppercase">{project.category}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{project.year}</span>
                </div>
                <h3 className="text-xl font-black tracking-tighter group-hover:text-brand-orange transition-colors duration-300">{project.title}</h3>
                {project.techSpecs && (
                    <p className="text-xs text-slate-500 font-inter mt-1 italic">
                        <span className="text-brand-orange/50 not-italic mr-1">Precision:</span> {project.techSpecs}
                    </p>
                )}
            </div>
        </div>
    );
}

function DigitalProjectCard({ project }: { project: PortfolioProject }) {
    return (
        <div className="group relative">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
                <div className="lg:col-span-3">
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-900 group-hover:border-brand-orange/30 transition-colors">
                        <Image
                            src={project.imageUrl}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            sizes="(max-width: 1024px) 100vw, 60vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/40 to-transparent" />
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/5 text-[10px] font-black uppercase tracking-widest text-brand-orange rounded-full">
                                {project.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {project.client} • {project.year}
                            </span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">{project.title}</h3>
                    </div>

                    <p className="text-slate-400 font-inter leading-relaxed">
                        {project.description}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        {project.links?.web && (
                            <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 h-12 px-6 rounded-xl font-bold">
                                <a href={project.links.web} target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-4 h-4 mr-2" /> Live Site
                                </a>
                            </Button>
                        )}
                        {project.links?.appStore && (
                            <Button asChild variant="ghost" className="bg-white/5 hover:bg-white/10 h-12 px-6 rounded-xl font-bold">
                                <a href={project.links.appStore} target="_blank" rel="noopener noreferrer">
                                    <AppStoreIcon className="w-4 h-4 mr-2" /> iOS
                                </a>
                            </Button>
                        )}
                        {project.links?.playStore && (
                            <Button asChild variant="ghost" className="bg-white/5 hover:bg-white/10 h-12 px-6 rounded-xl font-bold">
                                <a href={project.links.playStore} target="_blank" rel="noopener noreferrer">
                                    <PlayStoreIcon className="w-4 h-4 mr-2" /> Android
                                </a>
                            </Button>
                        )}
                        <Link href={project.wizardPath}>
                            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white h-12 px-6 rounded-xl font-bold">
                                Démarrer un projet <ArrowUpRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

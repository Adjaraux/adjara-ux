'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shirt, Sparkles, Palette, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ServicesGrid() {
    const services = [
        {
            icon: Shirt,
            title: 'Marquage & Textile',
            description: 'Flocage personnalisé, sérigraphie et impression numérique sur textile. Bâches publicitaires grand format.',
            features: ['Flocage vinyle', 'Sérigraphie', 'Bâches PVC', 'Textiles personnalisés'],
            gradient: 'from-rose-500 to-pink-600',
            bgGradient: 'from-rose-50 to-pink-50',
            borderColor: 'border-rose-200',
            link: '/dashboard/client/projects/new?cat=textile-perso'
        },
        {
            icon: Sparkles,
            title: 'Gravure & Enseignes',
            description: 'Gravure laser sur bois, plexiglas et métal. Enseignes lumineuses et signalétique professionnelle.',
            features: ['Gravure laser', 'Plexiglas & bois', 'Enseignes LED', 'Signalétique'],
            gradient: 'from-amber-500 to-orange-600',
            bgGradient: 'from-amber-50 to-orange-50',
            borderColor: 'border-amber-200',
            link: '/dashboard/client/projects/new?cat=engraving'
        },
        {
            icon: Palette,
            title: 'Design Digital',
            description: 'Conception UI/UX professionnelle, maquettes interactives et identités visuelles complètes.',
            features: ['UI/UX Design', 'Prototypes Figma', 'Identité visuelle', 'Web design'],
            gradient: 'from-indigo-500 to-blue-600',
            bgGradient: 'from-indigo-50 to-blue-50',
            borderColor: 'border-indigo-200',
            link: '/dashboard/client/projects/new?cat=design-dev&sub=ui-ux'
        },
        {
            icon: GraduationCap,
            title: 'Pack Essentiel',
            description: '9 mois pour maîtriser les bases. 3 mois de Tronc Commun + 6 mois de spécialisation métier.',
            features: ['Tronc Commun (3 mois)', 'Spécialisation (6 mois)', 'Certificat Fondamental', 'Entrée rapide métier'],
            gradient: 'from-cyan-500 to-blue-600',
            bgGradient: 'from-cyan-50 to-blue-50',
            borderColor: 'border-cyan-200',
            link: '/pricing'
        },
        {
            icon: GraduationCap,
            title: 'Pack Expert',
            description: '27 mois pour l\'excellence. Tronc commun + Cursus complet pour devenir un expert confirmé.',
            features: ['Tronc Commun (3 mois)', 'Expertise Métier (24 mois)', 'Diplôme Expert', 'Incubation Projet'],
            gradient: 'from-purple-500 to-violet-600',
            bgGradient: 'from-purple-50 to-violet-50',
            borderColor: 'border-purple-200',
            link: '/pricing'
        },
        {
            icon: Sparkles,
            title: 'Master Academy',
            description: '36 mois : L\'élite polycompétente. Maîtrisez les 3 branches (Physique + Digital + Tech).',
            features: ['Triple Compétence', 'Gestion de Projet', 'Leadership', 'Accès illimité Lab'],
            gradient: 'from-amber-500 to-orange-600',
            bgGradient: 'from-amber-50 to-orange-50',
            borderColor: 'border-amber-200',
            link: '/pricing'
        },
    ];

    return (
        <section id="services" className="py-20 px-4 bg-[#05080f]">
            <div className="container mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Nos Services & <span className="text-brand-orange">Formations</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Du concret au virtuel, nous accompagnons vos projets avec expertise et passion
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {services.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <Card
                                key={index}
                                className={`bg-white/5 border border-white/10 hover:border-brand-orange/30 hover:shadow-2xl hover:shadow-brand-orange/5 transition-all duration-300 hover:-translate-y-2 cursor-pointer group rounded-2xl overflow-hidden`}
                            >
                                <CardHeader className="pb-4">
                                    <div className={`w-14 h-14 bg-brand-orange/10 text-brand-orange rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300 shadow-sm`}>
                                        <Icon size={28} />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white">
                                        {service.title}
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-sm h-12 line-clamp-2">
                                        {service.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 mb-6 min-h-[100px]">
                                        {service.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center text-slate-300 text-sm">
                                                <div className={`w-1.5 h-1.5 bg-brand-orange rounded-full mr-3 shrink-0 shadow-laser-sm`}></div>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={service.link}>
                                        <Button
                                            className={`w-full bg-white/5 border border-white/10 hover:bg-brand-orange hover:text-white transition-all rounded-xl h-11 text-white`}
                                        >
                                            En savoir plus
                                            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

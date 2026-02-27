'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HeroSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8 }
        }
    };

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#05080f] pt-20">
            {/* Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none opacity-50" />

            <motion.div
                className="container relative z-10 px-4 text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Brand Tag/Status */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-xs font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                    </span>
                    UX Leadership & Excellence
                </motion.div>

                {/* Primary Heading */}
                <motion.h1
                    variants={itemVariants}
                    className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white mb-6 leading-[0.9]"
                >
                    Adjara <span className="text-brand-orange relative text-gradient">UX</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Nous transformons la complexité technique en expériences numériques <span className="text-white font-medium">mémorables</span>.
                    Design de pointe. Expertise sans compromis.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/dashboard/client/projects/new">
                        <Button
                            size="lg"
                            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold h-14 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-orange/20"
                        >
                            Lancer un projet <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href="/realisations">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white h-14 px-8 rounded-xl font-medium transition-all"
                        >
                            Réalisations <Maximize2 className="ml-2 w-4 h-4 text-brand-orange" />
                        </Button>
                    </Link>
                    <Link href="/academie">
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-white/10 hover:bg-white/5 text-white h-14 px-8 rounded-xl font-medium transition-all"
                        >
                            L'Académie <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </motion.div>

                {/* Visual Accent: Precise Lines */}
                <div className="absolute -bottom-40 left-0 w-full flex justify-between px-20 opacity-20 pointer-events-none">
                    <div className="h-[500px] w-px bg-gradient-to-b from-brand-orange/50 to-transparent" />
                    <div className="h-[500px] w-px bg-gradient-to-b from-brand-orange/50 to-transparent" />
                </div>
            </motion.div>
        </section>
    );
}

import { Target, Users, Shield, Rocket, Heart, Globe } from 'lucide-react';
import ContactForm from '@/components/contact-form';

export default function AboutPage() {
    return (
        <div className="dark min-h-screen bg-obsidian text-white pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Hero */}
                <div className="mb-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-[10px] font-black uppercase tracking-widest mb-6">
                        Qui sommes-nous ?
                    </div>
                    <h1 className="text-6xl md:text-8xl font-outfit font-black tracking-tighter mb-8 leading-[0.9]">
                        L'Excellence <br /><span className="text-brand-orange text-gradient">sans compromis.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl leading-relaxed font-inter">
                        Adjara UX est né d'une conviction simple : l'Afrique mérite des standards de design et de technologie de classe mondiale. Nous ne sommes pas qu'une agence, nous sommes le hub de l'innovation laser.
                    </p>
                </div>

                {/* Values Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {[
                        {
                            icon: Target,
                            title: "Vision Laser",
                            desc: "Nous ne nous contentons pas de 'faire'. Nous visons la précision absolue dans chaque pixel et chaque ligne de code.",
                            gradient: "from-brand-orange/20 to-transparent"
                        },
                        {
                            icon: Globe,
                            title: "Impact Local, Standard Mondial",
                            desc: "Basés à Lomé, nous déployons des solutions capables de rivaliser avec les meilleurs studios de la Silicon Valley ou de Londres.",
                            gradient: "from-blue-500/20 to-transparent"
                        },
                        {
                            icon: Shield,
                            title: "Robustesse & Luxe",
                            desc: "Le luxe n'est pas que visuel. C'est la garantie d'une structure solide, évolutive et sécurisée pour vos actifs critiques.",
                            gradient: "from-purple-500/20 to-transparent"
                        }
                    ].map((item, i) => (
                        <div key={i} className={`p-10 rounded-[2.5rem] bg-white/5 border border-white/10 bg-gradient-to-br ${item.gradient} hover:scale-[1.02] transition-transform duration-500`}>
                            <item.icon className="w-12 h-12 text-brand-orange mb-8" />
                            <h3 className="text-2xl font-bold mb-4 tracking-tight">{item.title}</h3>
                            <p className="text-slate-400 leading-relaxed font-inter text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Story / Stats Section */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[100px] -mr-32 -mt-32" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter">Un écosystème en <span className="text-brand-orange">pleine expansion.</span></h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed font-inter">
                                Fondée par des passionnés, Adjara UX réunit plus de 20 experts multidisciplinaires travaillant main dans la main pour redéfinir les codes du digital en Afrique de l'Ouest.
                            </p>
                            <div className="flex gap-12">
                                <div>
                                    <div className="text-4xl font-black text-brand-orange">2023</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Lancement</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-brand-orange">50+</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Projets Livrés</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-brand-orange">2</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Plateformes Clés</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square rounded-[2rem] bg-gradient-to-tr from-brand-orange to-amber-600 opacity-20 absolute inset-0 blur-2xl" />
                            <div className="relative aspect-square rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center p-12">
                                <Rocket className="w-32 h-32 text-brand-orange animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <ContactForm />
            </div>
        </div>
    );
}

import { Mail, MessageCircle, MapPin, Globe, Headphones } from 'lucide-react';
import ContactForm from '@/components/contact-form';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-obsidian text-white pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-[10px] font-black uppercase tracking-widest mb-6">
                        Discutons de votre Futur
                    </div>
                    <h1 className="text-6xl md:text-8xl font-outfit font-black tracking-tighter mb-8 leading-[0.9]">
                        Entrer dans le <span className="text-brand-orange text-gradient">Cercle.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-inter">
                        Que vous soyez prêt à lancer un projet d'envergure ou que vous souhaitiez rejoindre l'élite de l'Académie, nous sommes à votre écoute.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    {/* Left Info Column */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="relative p-10 rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden group hover:border-brand-orange/30 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl -mr-16 -mt-16 group-hover:bg-brand-orange/10 transition-colors" />
                            <Headphones className="w-12 h-12 text-brand-orange mb-8" />
                            <h3 className="text-2xl font-bold mb-4 tracking-tight">Support Stratégique</h3>
                            <p className="text-slate-400 mb-6 leading-relaxed text-sm font-inter">
                                Notre équipe d'experts vous accompagne dans la définition de vos besoins et l'optimisation de vos parcours utilisateurs.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-white font-bold">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-brand-orange" />
                                    </div>
                                    contactadjara@gmail.com
                                </div>
                                <div className="flex items-center gap-4 text-white font-bold">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-brand-orange" />
                                    </div>
                                    +228 90625905
                                </div>
                            </div>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-brand-orange" /> Localisation
                            </h3>
                            <p className="text-slate-400 leading-relaxed text-sm font-inter mb-6">
                                Notre hub créatif est situé au cœur de Lomé, point névralgique de l'innovation tech en Afrique de l'Ouest.
                            </p>
                            <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 font-black uppercase tracking-[0.2em] text-[10px]">
                                Interactive Map Loading...
                            </div>
                        </div>
                    </div>

                    {/* Right Form Column */}
                    <div className="lg:col-span-7">
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-orange/5 blur-3xl -z-10" />
                            {/* We use the refined ContactForm component */}
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

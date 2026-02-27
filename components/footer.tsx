import { Linkedin, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { LogoBrand } from './brand/logo-brand';

export default function Footer() {
    return (
        <footer className="bg-[#05080f] border-t border-white/10 py-16 px-4">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-block">
                            <LogoBrand />
                        </Link>
                        <p className="text-slate-400 font-inter text-sm leading-relaxed">
                            L'excellence du Design et de la Tech en Afrique. Vos ambitions, notre précision.
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://linkedin.com/company/adjara-ux" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-orange transition-all duration-300 shadow-sm">
                                <Linkedin size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-outfit font-bold text-lg mb-6 text-white">Nos Services</h3>
                        <ul className="space-y-3 text-slate-400 text-sm font-medium">
                            <li><Link href="/prestations#textile-perso" className="hover:text-brand-orange transition-colors">Textile & Personnalisation</Link></li>
                            <li><Link href="/prestations#design-dev" className="hover:text-brand-orange transition-colors">Design & Développement</Link></li>
                            <li><Link href="/prestations#engraving" className="hover:text-brand-orange transition-colors">Gravure & Découpe</Link></li>
                            <li><Link href="/realisations" className="hover:text-brand-orange transition-colors">Portfolio / Projets</Link></li>
                            <li><Link href="/case-studies" className="hover:text-brand-orange transition-colors">Études de Cas</Link></li>
                        </ul>
                    </div>

                    {/* Formations */}
                    <div>
                        <h3 className="font-outfit font-bold text-lg mb-6 text-white">Académie</h3>
                        <ul className="space-y-3 text-slate-400 text-sm font-medium">
                            <li><Link href="/academie" className="hover:text-brand-orange transition-colors">Formations Tech</Link></li>
                            <li><Link href="/pricing" className="hover:text-brand-orange transition-colors">Modalités & Tarifs</Link></li>
                            <li><Link href="/auth" className="hover:text-brand-orange transition-colors">Espace Membre</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-outfit font-bold text-lg mb-6 text-white">Contact</h3>
                        <ul className="space-y-4 text-slate-400 text-sm font-medium">
                            <li className="flex items-start">
                                <MapPin size={18} className="mr-3 text-brand-orange shrink-0" />
                                <span>Lomé, Maritime, Togo</span>
                            </li>
                            <li className="flex items-center">
                                <Mail size={18} className="mr-3 text-brand-orange shrink-0" />
                                <a href="mailto:contactadjara@gmail.com" className="hover:text-brand-orange transition-colors">
                                    contactadjara@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        <p>© 2026 Adjara UX. Tous droits réservés.</p>
                        <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-2">
                            <Link href="/a-propos" className="hover:text-brand-orange transition-colors">À propos</Link>
                            <Link href="/conditions-generales" className="hover:text-brand-orange transition-colors">CGV</Link>
                            <Link href="/politique-confidentialite" className="hover:text-brand-orange transition-colors">Confidentialité</Link>
                            <Link href="/contact" className="hover:text-brand-orange transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

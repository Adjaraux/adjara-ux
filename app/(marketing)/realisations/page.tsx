import { Metadata } from 'next';
import { RealisationsClient } from './realisations-client';
import { PORTFOLIO_POHLS } from '@/lib/portfolio-data';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ pohl?: string }> }): Promise<Metadata> {
    const { pohl: pohlIdQuery } = await searchParams;
    const pohlId = pohlIdQuery || 'textile-perso';
    const pohl = PORTFOLIO_POHLS.find(p => p.id === pohlId);

    const title = pohl
        ? `${pohl.label} | Réalisations Prestige | Adjara UX`
        : 'Nos Réalisations | Adjara UX';

    const description = pohl
        ? `Découvrez nos créations d'exception en ${pohl.label}. Design haut de gamme, précision laser et textile personnalisé de luxe.`
        : 'Explorez le portfolio d\'Adjara UX : textile de luxe, design digital et gravure de précision.';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: ['/og-portfolio.jpg'], // Should be a default or pohl-specific image
        },
    };
}

export default function PortfolioPage() {
    return <RealisationsClient />;
}

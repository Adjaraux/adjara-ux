export type ProjectPohl = 'textile-perso' | 'design-dev' | 'engraving';

export interface PortfolioProject {
    id: string;
    slug: string;
    title: string;
    description: string;
    pohl: ProjectPohl;
    category: string; // Sub-category ID from Wizard
    imageUrl: string;
    videoUrl?: string; // Light muted loop
    tags: string[];
    client?: string;
    year: string;
    wizardPath: string; // Pre-filled link to wizard
    techSpecs?: string; // High precision detail
    links?: {
        web?: string;
        appStore?: string;
        playStore?: string;
    };
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = []; // Empty as it's now in Supabase

export const PORTFOLIO_POHLS = [
    { id: 'all', label: 'Tous les projets' },
    { id: 'textile-perso', label: 'Textile & Perso' },
    { id: 'design-dev', label: 'Design & Dev' },
    { id: 'engraving', label: 'Gravure & Découpe' }
];

export const SUB_CATEGORIES_MAP: Record<ProjectPohl, { id: string, label: string }[]> = {
    'textile-perso': [
        { id: 'tshirt-polo', label: 'T-shirt / Polo' },
        { id: 'cap', label: 'Casquette / Chapeau' },
        { id: 'keychain', label: 'Porte-clés' },
        { id: 'fabric', label: 'Tissus' },
        { id: 'others', label: 'Autres' }
    ],
    'design-dev': [
        { id: 'web', label: 'Site Web' },
        { id: 'ui-ux', label: 'UI/UX Design' },
        { id: 'graphic', label: 'Graphisme' }
    ],
    'engraving': [
        { id: 'signage', label: 'Signalétique' },
        { id: 'laser-cnc', label: 'Découpe Laser' }
    ]
};

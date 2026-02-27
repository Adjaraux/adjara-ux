import {
    Shirt,
    Scissors,
    Monitor,
    PenTool,
    Cpu,
    Layers,
    Type,
    Scan,
    Maximize,
    Palette,
    Globe,
    FileImage
} from 'lucide-react';

// --- Types ---

export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';

export interface FieldDef {
    name: string;
    label: string;
    type: FieldType;
    options?: string[]; // For select/radio
    placeholder?: string;
    suffix?: string; // e.g. "cm", "pixels"
    required?: boolean;
    helperText?: string;
}

export interface SubCategory {
    id: string;
    label: string;
    icon?: any;
    description?: string;
    fields: FieldDef[];
}

export interface Category {
    id: string;
    label: string;
    icon: any;
    color: string; // Tailwind class for border/bg accents
    subcategories: SubCategory[];
}

// --- Reusable Field Blocks (DRY) ---

const DIMENSIONS_FIELDS: FieldDef[] = [
    { name: 'width', label: 'Largeur', type: 'number', suffix: 'cm', required: true, placeholder: 'Ex: 50' },
    { name: 'height', label: 'Hauteur', type: 'number', suffix: 'cm', required: true, placeholder: 'Ex: 30' },
    { name: 'quantity', label: 'Quantité', type: 'number', required: true, placeholder: '1' }
];

const PRINT_SPECS: FieldDef[] = [
    { name: 'format', label: 'Format', type: 'select', options: ['A4', 'A3', 'A5', 'Grand Format', 'Custom'], required: true },
    { name: 'paper_type', label: 'Type de Papier/Support', type: 'text', placeholder: 'Ex: Glacé 135g' }
];

// --- Configuration ---

export const WIZARD_CONFIG: Category[] = [
    // 1. TEXTILE & PERSO
    {
        id: 'textile-perso',
        label: 'Textile & Personnalisation',
        icon: Shirt,
        color: 'indigo-500',
        subcategories: [
            {
                id: 'tshirt-polo',
                label: 'T-shirt / Polo',
                icon: Shirt,
                description: 'Flocage, Broderie, Transfert',
                fields: [
                    { name: 'garment_type', label: 'Type de vêtement', type: 'select', options: ['T-shirt Col Rond', 'T-shirt Col V', 'Polo Manches Courtes', 'Polo Manches Longues'], required: true },
                    { name: 'color', label: 'Couleur du textile', type: 'text', placeholder: 'Ex: Bleu Marine' },
                    { name: 'sizes', label: 'Tailles (S/M/L/XL)', type: 'text', placeholder: 'Ex: 10M, 5L, 2XL', helperText: 'Précisez la répartition des tailles.' },
                    { name: 'print_zones', label: 'Zones de marquage', type: 'select', options: ['Cœur (Petit)', 'Dos (Grand)', 'Cœur + Dos', 'Manche'], required: true },
                    { name: 'quantity', label: 'Quantité Totale', type: 'number', required: true }
                ]
            },
            {
                id: 'cap',
                label: 'Casquette / Chapeau',
                icon: Smile, // Placeholder, usually distinct
                description: 'Broderie 3D, Patch',
                fields: [
                    { name: 'style', label: 'Style', type: 'select', options: ['Trucker', 'Baseball', 'Snapback', 'Bob'], required: true },
                    { name: 'color', label: 'Couleur', type: 'text' },
                    { name: 'logo_type', label: 'Type de Logo', type: 'select', options: ['Broderie Plate', 'Broderie 3D', 'Patch'], required: true },
                    { name: 'quantity', label: 'Quantité', type: 'number', required: true }
                ]
            },
            {
                id: 'fabric',
                label: 'Tissus & Découpe',
                icon: Scissors,
                description: 'Métrage, Nappes, Rideaux',
                fields: [
                    { name: 'material', label: 'Matière', type: 'text', placeholder: 'Ex: Coton, Polyester, Lin', required: true },
                    ...DIMENSIONS_FIELDS // Reuse Dimensions
                ]
            },
            {
                id: 'keychain',
                label: 'Porte-clés',
                icon: Scan,
                description: 'Goodies, Cadeaux d\'entreprise',
                fields: [
                    { name: 'shape', label: 'Forme', type: 'select', options: ['Rond', 'Carré', 'Rectangle', 'Découpe Forme Logo'], required: true },
                    { name: 'sides', label: 'Faces', type: 'radio', options: ['Recto seul', 'Recto-Verso'], required: true },
                    { name: 'material', label: 'Matériau', type: 'select', options: ['Plastique', 'Métal', 'Bois', 'Cuir'] },
                    { name: 'quantity', label: 'Quantité', type: 'number', required: true }
                ]
            },
            {
                id: 'other-support',
                label: 'Autres Supports',
                icon: Layers,
                description: 'Mugs, Stylos, Tapis souris...',
                fields: [
                    { name: 'support_type', label: 'Type de support', type: 'text', required: true, placeholder: 'Ex: Mug Céramique' },
                    ...DIMENSIONS_FIELDS
                ]
            }
        ]
    },

    // 2. DESIGN & DEV
    {
        id: 'design-dev',
        label: 'Design & Développement',
        icon: Monitor,
        color: 'blue-500',
        subcategories: [
            {
                id: 'web',
                label: 'Site Web / App',
                icon: Globe,
                description: 'Vitrine, E-commerce, SaaS',
                fields: [
                    { name: 'project_type', label: 'Type de projet', type: 'select', options: ['Site Vitrine', 'E-commerce', 'Application Web', 'Landing Page'], required: true },
                    { name: 'page_count', label: 'Nombre de pages estimé', type: 'number', placeholder: 'Ex: 5' },
                    { name: 'features', label: 'Fonctions clés', type: 'textarea', placeholder: 'Ex: Blog, Paiement, Réservation...', required: true },
                    { name: 'cms_preference', label: 'Préférence technique', type: 'select', options: ['Aucune', 'WordPress', 'Next.js/React', 'Shopify'] }
                ]
            },
            {
                id: 'ui-ux',
                label: 'UI / UX Design',
                icon: Palette,
                description: 'Maquettage Figma, User flows',
                fields: [
                    { name: 'platform', label: 'Plateforme', type: 'select', options: ['Web (Desktop/Mobile)', 'Mobile App (iOS/Android)', 'Dashboard'], required: true },
                    { name: 'screens', label: 'Nombre d\'écrans clés', type: 'number', required: true },
                    { name: 'style', label: 'Style souhaité', type: 'text', placeholder: 'Ex: Minimaliste, Dark Mode...' }
                ]
            },
            {
                id: 'graphic',
                label: 'Graphisme & Print',
                icon: FileImage,
                description: 'Flyers, Affiches, Logos',
                fields: [
                    { name: 'job_type', label: 'Type de création', type: 'select', options: ['Logo / Identité', 'Flyer / Brochure', 'Affiche', 'Carte de Visite', 'Réseaux Sociaux'], required: true },
                    { name: 'dimension_context', label: 'Format / Dimensions', type: 'text', placeholder: 'Ex: A4, 1080x1080px', required: true },
                    { name: 'usage', label: 'Usage', type: 'radio', options: ['Print (Impression)', 'Web (Digital)', 'Les deux'], required: true }
                ]
            }
        ]
    },

    // 3. GRAVURE & DÉCOUPE
    {
        id: 'engraving',
        label: 'Gravure & Découpe',
        icon: Cpu,
        color: 'amber-600',
        subcategories: [
            {
                id: 'signage',
                label: 'Enseignes / Signalétique',
                icon: Type,
                description: 'Panneaux, Lettres découpées',
                fields: [
                    { name: 'type', label: 'Type', type: 'select', options: ['Panneau Dibond', 'Lettres PVC', 'Caisson Lumineux'], required: true },
                    { name: 'install_location', label: 'Lieu de pose', type: 'select', options: ['Intérieur', 'Extérieur'] },
                    ...DIMENSIONS_FIELDS
                ]
            },
            {
                id: 'laser-cnc',
                label: 'Découpe Laser / CNC',
                icon: Maximize,
                description: 'Pièces techniques, Pochoirs',
                fields: [
                    { name: 'machine', label: 'Technologie', type: 'select', options: ['Laser CO2', 'Fraiseuse CNC'], required: true },
                    { name: 'material', label: 'Matériau', type: 'select', options: ['Bois (MDF/CP)', 'Plexiglas (PMMA)', 'Alu Dibond', 'Cuir'], required: true },
                    { name: 'thickness', label: 'Épaisseur', type: 'text', placeholder: 'Ex: 5mm', required: true },
                    { name: 'file_provided', label: 'Fichier fourni ?', type: 'radio', options: ['Oui (DXF/AI/PDF)', 'Non (À créer)'], required: true },
                    ...DIMENSIONS_FIELDS
                ]
            }
        ]
    }
];

// Helper to get helper icons/components if needed
import { Smile } from 'lucide-react'; // Placeholder for Cap if needed

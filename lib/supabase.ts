import { createBrowserClient } from '@supabase/ssr';

// On récupère les variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// AJOUTE CE CHECK DE SÉCURITÉ POUR LE BUILD
if (!supabaseUrl || !supabaseKey) {
  console.error("VARS MISSING IN VERCEL. Using placeholders to bypass build error.");
}

// On utilise les vraies variables, ou des chaînes vides si elles sont absentes
export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder'
);
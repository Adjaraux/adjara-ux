import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, message, projectType, formationBranch, formationDuration } = body;

        // Validation basique
        if (!name || !email || !projectType) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants' },
                { status: 400 }
            );
        }

        // Préparation des données pour Supabase
        const { data, error } = await supabase
            .from('inscriptions')
            .insert([
                {
                    nom: name,
                    email: email,
                    telephone: phone,
                    type_projet: projectType,
                    message: message,
                    branche: formationBranch || null,
                    duree_pack: formationDuration || null,
                },
            ])
            .select();

        if (error) {
            console.error('Erreur Supabase:', error);
            return NextResponse.json(
                { error: 'Erreur lors de l\'enregistrement en base de données' },
                { status: 500 }
            );
        }

        // TODO: Envoyer email de confirmation (Prochaine étape avec Resend)

        return NextResponse.json(
            { success: true, message: 'Demande enregistrée avec succès', data },
            { status: 200 }
        );

    } catch (error) {
        console.error('Erreur serveur:', error);
        return NextResponse.json(
            { error: 'Une erreur interne est survenue' },
            { status: 500 }
        );
    }
}

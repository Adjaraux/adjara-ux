'use server';

import { getAdminClient } from '@/utils/supabase-admin';

interface MatchResult {
    talentId: string;
    fullName: string;
    score: number;
    reasons: string[];
}

/**
 * SCORING MOTOR 🧠
 * Analyzes a project brief and suggests the best matching talents from the LMS.
 */
export async function suggestTalentsForProject(projectId: string): Promise<MatchResult[]> {
    const admin = getAdminClient();

    // 1. Fetch Project Requirements
    const { data: project } = await admin
        .from('projects')
        .select('required_specialty, specs, title, description')
        .eq('id', projectId)
        .single();

    if (!project) return [];

    const specialty = project.required_specialty;
    const briefText = `${project.title} ${project.description} ${JSON.stringify(project.specs)}`.toLowerCase();

    // 2. Fetch Potential Talents (High-performing students)
    const { data: talents } = await admin
        .from('profiles')
        .select('id, full_name, specialty, pack_type, bio')
        .eq('role', 'student')
        .limit(20);

    if (!talents) return [];

    const scores: MatchResult[] = talents.map(talent => {
        let score = 0;
        const reasons: string[] = [];

        // Simple Keyword Matching (To be replaced by Vector/AI search in the future)
        if (talent.specialty === specialty) {
            score += 40;
            reasons.push("Spécialité correspondante");
        }

        if (talent.pack_type === 'master') {
            score += 20;
            reasons.push("Niveau Master (Expertise confirmée)");
        }

        // Search bio for keywords found in brief
        const keywords = briefText.split(/\s+/).filter(w => w.length > 4);
        const bio = (talent.bio || '').toLowerCase();
        let matches = 0;
        keywords.forEach(kw => {
            if (bio.includes(kw)) matches++;
        });

        if (matches > 0) {
            score += Math.min(matches * 5, 30);
            reasons.push(`${matches} mots-clés correspondants dans le profil`);
        }

        return {
            talentId: talent.id,
            fullName: talent.full_name || "Anonyme",
            score,
            reasons
        };
    });

    // Sort by score and return top 3
    return scores.sort((a, b) => b.score - a.score).slice(0, 3);
}

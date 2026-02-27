'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface DraftData {
    id?: string;
    step: number;
    category_id?: string;
    subcategory_id?: string;
    form_data: any;
}

/**
 * Saves a project draft to the database.
 */
export async function saveProjectDraft(draft: DraftData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Authentication required" };

    const payload = {
        user_id: user.id,
        email: user.email,
        step: draft.step,
        category_id: draft.category_id,
        subcategory_id: draft.subcategory_id,
        form_data: draft.form_data,
        updated_at: new Date().toISOString()
    };

    if (draft.id) {
        const { data, error } = await supabase
            .from('project_drafts')
            .update(payload)
            .eq('id', draft.id)
            .select()
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } else {
        const { data, error } = await supabase
            .from('project_drafts')
            .insert(payload)
            .select()
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    }
}

/**
 * Fetches the most recent draft for the user.
 */
export async function getLatestDraft() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('project_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_recovered', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error) return null;
    return data;
}

/**
 * Marks a draft as recovered/completed.
 */
export async function markDraftRecovered(draftId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('project_drafts')
        .update({ is_recovered: true })
        .eq('id', draftId);

    return { success: !error };
}

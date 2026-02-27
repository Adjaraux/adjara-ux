'use server';

import { createClient } from '../../utils/supabase/server';

export async function deleteInscriptionAction(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('inscriptions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting inscription:", error);
        return { success: false, message: error.message };
    }
}

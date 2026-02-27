import { createClient } from '../../utils/supabase/server';

export async function getAdminInscriptions() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('inscriptions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching inscriptions:", error);
        return { success: false, message: error.message };
    }
}


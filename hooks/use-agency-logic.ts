import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { differenceInDays, parseISO } from 'date-fns';

export type Milestone = {
    id: string;
    title: string;
    status: 'pending' | 'completed';
    completed_at: string | null;
    due_date: string | null;
    order_index: number;
};

export type Project = {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'review' | 'completed' | 'archived';
    service_type: 'design' | 'gravure' | 'dev' | 'consulting';
    milestones?: Milestone[];
    created_at: string;
};

export const useAgencyLogic = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch Projects
                const { data: projectsData, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('client_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (projectsData && projectsData.length > 0) {
                    setProjects(projectsData as Project[]);
                    // Set first active (in_progress) as default, or just the first one
                    const active = projectsData.find(p => p.status === 'in_progress' || p.status === 'review') || projectsData[0];

                    // Fetch Milestones for the active project
                    const { data: milestonesData } = await supabase
                        .from('project_milestones')
                        .select('*')
                        .eq('project_id', active.id)
                        .order('order_index', { ascending: true });

                    setActiveProject({
                        ...active,
                        milestones: milestonesData || []
                    } as Project);
                }

            } catch (error) {
                console.error('Agency Logic Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return {
        projects,
        activeProject,
        loading
    };
};

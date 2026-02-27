-- FIX 1: Allow Students to view their own certificates
-- This fixes the "Lock Logic" where students are stuck even if certified.
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates"
ON certificates FOR SELECT
USING (auth.uid() = user_id);

-- Fallback: If the policy "Certificates are viewable by everyone" exists, it might be too broad or problematic if not applied correctly.
-- Dropping it to be cleaner if desired, or keeping it if intended.
-- DROP POLICY IF EXISTS "Certificates are viewable by everyone" ON certificates;


-- FIX 2: Allow Clients to view their own projects (All Statuses)
-- This fixes "Mes Projets" list being empty for Clients.
DROP POLICY IF EXISTS "Clients can view own projects" ON projects;
CREATE POLICY "Clients can view own projects"
ON projects FOR SELECT
USING (auth.uid() = client_id);

-- Ensure Students can still view OPEN projects (likely already exists, but good to ensure)
DROP POLICY IF EXISTS "Students can view open projects" ON projects;
CREATE POLICY "Students can view open projects"
ON projects FOR SELECT
USING (status = 'open' OR status = 'in_progress'); -- Students need to see 'in_progress' if assigned?
-- Wait, if assigned, they need to see it.
CREATE POLICY "Students can view assigned projects"
ON projects FOR SELECT
USING (assigned_talent_id = auth.uid());


-- FIX 3: Ensure 'project_deliverables' are viewable by Client (owner of project) and Admin and Uploader
ALTER TABLE project_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view deliverables for their projects"
ON project_deliverables FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_deliverables.project_id
        AND projects.client_id = auth.uid()
    )
);

CREATE POLICY "Uploaders can view own deliverables"
ON project_deliverables FOR SELECT
USING (uploader_id = auth.uid());

-- Create academy_settings table for global configuration (Key-Value JSONB)
CREATE TABLE IF NOT EXISTS academy_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE academy_settings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage settings" ON academy_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- All authenticated users can read (needed for generating their own certificates)
CREATE POLICY "Authenticated can read settings" ON academy_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Default Certificate Configuration
INSERT INTO academy_settings (key, value)
VALUES (
  'certificate_default',
  '{
    "title": "Certificat de Réussite",
    "subtitle": "Décerné officiellement à",
    "primaryColor": "#4f46e5",
    "secondaryColor": "#1e293b",
    "signatureName": "Jean Formateur",
    "signatureRole": "Responsable Pédagogique",
    "logoText": "LOGO ÉCOLE",
    "showLogo": true,
    "showSignature": true
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

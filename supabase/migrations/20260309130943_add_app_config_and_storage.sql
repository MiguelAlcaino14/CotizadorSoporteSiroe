/*
  # Add app_config table and Storage bucket for documents

  1. New Tables
    - `app_config` - Stores configurable lists used throughout the app
      - `key` (text, primary key) - Config key (e.g. 'executives', 'statuses', 'currencies')
      - `values` (jsonb) - Array of string values
      - `updated_at` (timestamptz)

  2. Seed Data
    - Executives: list of executive names (replaces hardcoded "Juan Pérez", "María García")
    - Statuses: list of cotizacion statuses
    - Currencies: list of available currencies

  3. Storage
    - Creates a public 'documentos' bucket for file uploads

  4. Security
    - RLS enabled on app_config
    - All authenticated users can read
    - Only admins can update (via service role / admin functions)
*/

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  values jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update app_config"
  ON app_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

INSERT INTO app_config (key, values) VALUES
  ('executives', '["Juan Pérez", "María García"]'::jsonb),
  ('statuses', '["Borrador", "Pendiente", "Aprobada", "En ejecución", "Facturada"]'::jsonb),
  ('currencies', '["CLP", "UF"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documentos');

/*
  # Fix cotizacion_versiones UPDATE policy for null created_by

  ## Problem
  Existing cotizacion_versiones rows have created_by = NULL. The UPDATE policy
  checks created_by = auth.uid() which returns NULL (not true) when created_by
  is NULL, blocking the status update from "Vigente" to "Reemplazada" when
  creating new versions.

  ## Changes
  - Drop and recreate the UPDATE policy to allow updates when created_by IS NULL
    (legacy rows) while still enforcing ownership for rows with created_by set.
  - Admin users retain full update access.
*/

DROP POLICY IF EXISTS "Authenticated users can update cotizacion_versiones" ON cotizacion_versiones;

CREATE POLICY "Authenticated users can update cotizacion_versiones"
  ON cotizacion_versiones
  FOR UPDATE
  TO authenticated
  USING (
    created_by IS NULL
    OR created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by IS NULL
    OR created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

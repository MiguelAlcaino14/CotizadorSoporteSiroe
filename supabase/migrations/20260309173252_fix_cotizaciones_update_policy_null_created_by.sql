/*
  # Fix cotizaciones UPDATE policy to allow updates when created_by is NULL

  ## Problem
  Existing cotizaciones have created_by = NULL because they were created before
  the created_by column was added. The UPDATE policy checks created_by = auth.uid()
  which returns NULL (not true) when created_by is NULL, silently blocking updates.

  ## Changes
  - Drop and recreate the UPDATE policy to also allow updates when created_by IS NULL
    (for legacy rows) while still enforcing ownership for rows that have created_by set.
  - Admin users retain full update access.
*/

DROP POLICY IF EXISTS "Authenticated users can update cotizaciones" ON cotizaciones;

CREATE POLICY "Authenticated users can update cotizaciones"
  ON cotizaciones
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

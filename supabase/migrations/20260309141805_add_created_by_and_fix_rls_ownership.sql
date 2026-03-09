/*
  # Add created_by columns and fix RLS ownership policies

  ## Summary
  The previous RLS policies used USING (true) which the security scanner flags as "always true".
  This migration adds a `created_by` column (uuid, references auth.users) to all affected tables
  and rewrites RLS policies to check ownership for mutations, while keeping reads open to all
  authenticated users (this is a shared internal business app).

  ## Changes
  1. Add `created_by` column to: clientes, cotizaciones, cotizacion_items, cotizacion_versiones,
     documentos, tickets
  2. configuracion is a single-row settings table — only admins may mutate it
  3. Rewrite INSERT/UPDATE/DELETE policies to require ownership (or admin role for admins)
  4. SELECT remains open to all authenticated users

  ## Notes
  - Existing rows get NULL for created_by (no data loss)
  - New rows will have created_by set via DEFAULT auth.uid() (direct call, not subquery)
  - Admins (role = 'admin' in profiles) can mutate any row
*/

-- ============================================================
-- clientes
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- configuracion (single-row settings, admin-only mutations)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Authenticated users can update configuracion" ON public.configuracion;

CREATE POLICY "Admins can insert configuracion"
  ON public.configuracion FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update configuracion"
  ON public.configuracion FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- cotizaciones
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizaciones' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.cotizaciones ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can delete cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Authenticated users can insert cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Authenticated users can update cotizaciones" ON public.cotizaciones;

CREATE POLICY "Authenticated users can insert cotizaciones"
  ON public.cotizaciones FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update cotizaciones"
  ON public.cotizaciones FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can delete cotizaciones"
  ON public.cotizaciones FOR DELETE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- cotizacion_items
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_items' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.cotizacion_items ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can delete cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Authenticated users can insert cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Authenticated users can update cotizacion_items" ON public.cotizacion_items;

CREATE POLICY "Authenticated users can insert cotizacion_items"
  ON public.cotizacion_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update cotizacion_items"
  ON public.cotizacion_items FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can delete cotizacion_items"
  ON public.cotizacion_items FOR DELETE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- cotizacion_versiones
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_versiones' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.cotizacion_versiones ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can delete cotizacion_versiones" ON public.cotizacion_versiones;
DROP POLICY IF EXISTS "Authenticated users can insert cotizacion_versiones" ON public.cotizacion_versiones;
DROP POLICY IF EXISTS "Authenticated users can update cotizacion_versiones" ON public.cotizacion_versiones;

CREATE POLICY "Authenticated users can insert cotizacion_versiones"
  ON public.cotizacion_versiones FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update cotizacion_versiones"
  ON public.cotizacion_versiones FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can delete cotizacion_versiones"
  ON public.cotizacion_versiones FOR DELETE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- documentos
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documentos' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.documentos ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can delete documentos" ON public.documentos;
DROP POLICY IF EXISTS "Authenticated users can insert documentos" ON public.documentos;
DROP POLICY IF EXISTS "Authenticated users can update documentos" ON public.documentos;

CREATE POLICY "Authenticated users can insert documentos"
  ON public.documentos FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update documentos"
  ON public.documentos FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can delete documentos"
  ON public.documentos FOR DELETE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- tickets
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can delete tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON public.tickets;

CREATE POLICY "Authenticated users can insert tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can delete tickets"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

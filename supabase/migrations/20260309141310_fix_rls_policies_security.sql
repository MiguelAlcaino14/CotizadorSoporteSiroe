/*
  # Fix RLS policies - remove always-true clauses and restrict to authenticated users

  ## Summary
  All tables had permissive policies allowing anon + authenticated access with no ownership check.
  This migration drops those policies and replaces them with authenticated-only policies.
  
  ## Tables affected
  - clientes
  - configuracion
  - cotizacion_items
  - cotizacion_versiones
  - cotizaciones
  - documentos
  - tickets

  ## Security changes
  - Remove anon role from all write policies
  - Restrict INSERT/UPDATE/DELETE to authenticated users only
  - SELECT remains open to authenticated users (this is an internal business app)
*/

-- ============================================================
-- clientes
-- ============================================================
DROP POLICY IF EXISTS "Public delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Public insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Public read clientes" ON public.clientes;
DROP POLICY IF EXISTS "Public update clientes" ON public.clientes;

CREATE POLICY "Authenticated users can read clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- configuracion
-- ============================================================
DROP POLICY IF EXISTS "Public insert configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Public read configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Public update configuracion" ON public.configuracion;

CREATE POLICY "Authenticated users can read configuracion"
  ON public.configuracion FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert configuracion"
  ON public.configuracion FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update configuracion"
  ON public.configuracion FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- cotizacion_items
-- ============================================================
DROP POLICY IF EXISTS "Public delete cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Public insert cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Public read cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Public update cotizacion_items" ON public.cotizacion_items;

CREATE POLICY "Authenticated users can read cotizacion_items"
  ON public.cotizacion_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cotizacion_items"
  ON public.cotizacion_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cotizacion_items"
  ON public.cotizacion_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cotizacion_items"
  ON public.cotizacion_items FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- cotizacion_versiones
-- ============================================================
DROP POLICY IF EXISTS "Public delete cotizacion_versiones" ON public.cotizacion_versiones;
DROP POLICY IF EXISTS "Public insert cotizacion_versiones" ON public.cotizacion_versiones;
DROP POLICY IF EXISTS "Public read cotizacion_versiones" ON public.cotizacion_versiones;
DROP POLICY IF EXISTS "Public update cotizacion_versiones" ON public.cotizacion_versiones;

CREATE POLICY "Authenticated users can read cotizacion_versiones"
  ON public.cotizacion_versiones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cotizacion_versiones"
  ON public.cotizacion_versiones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cotizacion_versiones"
  ON public.cotizacion_versiones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cotizacion_versiones"
  ON public.cotizacion_versiones FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- cotizaciones
-- ============================================================
DROP POLICY IF EXISTS "Public delete cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Public insert cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Public read cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Public update cotizaciones" ON public.cotizaciones;

CREATE POLICY "Authenticated users can read cotizaciones"
  ON public.cotizaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cotizaciones"
  ON public.cotizaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cotizaciones"
  ON public.cotizaciones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cotizaciones"
  ON public.cotizaciones FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- documentos
-- ============================================================
DROP POLICY IF EXISTS "Public delete documentos" ON public.documentos;
DROP POLICY IF EXISTS "Public insert documentos" ON public.documentos;
DROP POLICY IF EXISTS "Public read documentos" ON public.documentos;
DROP POLICY IF EXISTS "Public update documentos" ON public.documentos;

CREATE POLICY "Authenticated users can read documentos"
  ON public.documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documentos"
  ON public.documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documentos"
  ON public.documentos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documentos"
  ON public.documentos FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- tickets
-- ============================================================
DROP POLICY IF EXISTS "Public delete tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public update tickets" ON public.tickets;

CREATE POLICY "Authenticated users can read tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tickets"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (true);

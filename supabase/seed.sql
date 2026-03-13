-- ============================================================
-- COTIZADOR SIROE - SEEDER PRODUCCIÓN
-- Ejecutar completo en Supabase SQL Editor de un proyecto nuevo
-- ============================================================

-- ============================================================
-- PROFILES (vinculada a auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'comercial',
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

-- Trigger: primer usuario registrado es admin, los demás son comercial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'comercial' END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rut text UNIQUE NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clientes"
  ON public.clientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- COTIZACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id text PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  executive text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'CLP',
  status text NOT NULL DEFAULT 'Borrador',
  requirement text DEFAULT '',
  requester_name text,
  version integer NOT NULL DEFAULT 1,
  uf_value numeric,
  validity_days integer NOT NULL DEFAULT 30,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cotizaciones"
  ON public.cotizaciones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cotizaciones"
  ON public.cotizaciones FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update cotizaciones"
  ON public.cotizaciones FOR UPDATE TO authenticated
  USING (
    created_by IS NULL
    OR created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    created_by IS NULL
    OR created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Authenticated users can delete cotizaciones"
  ON public.cotizaciones FOR DELETE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- COTIZACION ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cotizacion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id text NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  service text NOT NULL DEFAULT '',
  description text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CLP',
  category text NOT NULL DEFAULT '',
  rental_period text,
  rental_from text,
  rental_to text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cotizacion_items"
  ON public.cotizacion_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cotizacion_items"
  ON public.cotizacion_items FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update cotizacion_items"
  ON public.cotizacion_items FOR UPDATE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Authenticated users can delete cotizacion_items"
  ON public.cotizacion_items FOR DELETE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- COTIZACION VERSIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cotizacion_versiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id text NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Vigente',
  items_snapshot jsonb,
  total numeric,
  currency text,
  executive text,
  requirement text,
  requester_name text,
  uf_value numeric,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cotizacion_versiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cotizacion_versiones"
  ON public.cotizacion_versiones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cotizacion_versiones"
  ON public.cotizacion_versiones FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update cotizacion_versiones"
  ON public.cotizacion_versiones FOR UPDATE TO authenticated
  USING (
    created_by IS NULL
    OR created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    created_by IS NULL
    OR created_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Authenticated users can delete cotizacion_versiones"
  ON public.cotizacion_versiones FOR DELETE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id text PRIMARY KEY,
  cotizacion_id text REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
  client_name text NOT NULL DEFAULT '',
  assigned text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'En progreso',
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tickets"
  ON public.tickets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Authenticated users can delete tickets"
  ON public.tickets FOR DELETE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- DOCUMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id text NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  url text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read documentos"
  ON public.documentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert documentos"
  ON public.documentos FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update documentos"
  ON public.documentos FOR UPDATE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Authenticated users can delete documentos"
  ON public.documentos FOR DELETE TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CLP',
  category text NOT NULL DEFAULT 'Servicio',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read productos"
  ON public.productos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert productos"
  ON public.productos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update productos"
  ON public.productos FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can delete productos"
  ON public.productos FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- CONFIGURACION (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.configuracion (
  id integer PRIMARY KEY DEFAULT 1,
  company_name text NOT NULL DEFAULT 'Mi Empresa TI SpA',
  company_rut text NOT NULL DEFAULT '76.000.000-0',
  tickets_url text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read configuracion"
  ON public.configuracion FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert configuracion"
  ON public.configuracion FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update configuracion"
  ON public.configuracion FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- APP CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  values jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_config"
  ON public.app_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update app_config"
  ON public.app_config FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin')
  );

-- ============================================================
-- LOGIN LOGS (auditoría inmutable)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  email text NOT NULL DEFAULT '',
  logged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own login log"
  ON public.login_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own login logs"
  ON public.login_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion_id ON public.cotizacion_items (cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_versiones_cotizacion_id ON public.cotizacion_versiones (cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_client_id ON public.cotizaciones (client_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cotizacion_id ON public.documentos (cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cotizacion_id ON public.tickets (cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_logged_at ON public.login_logs (logged_at DESC);

-- ============================================================
-- STORAGE - bucket para documentos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos');

-- ============================================================
-- DATOS INICIALES DE PRODUCCIÓN
-- ============================================================

-- Configuración inicial de la empresa (editar antes de ejecutar)
INSERT INTO public.configuracion (id, company_name, company_rut, tickets_url)
VALUES (1, 'Siroe SpA', '76.000.000-0', '')
ON CONFLICT (id) DO NOTHING;

-- Listas configurables de la app
INSERT INTO public.app_config (key, values) VALUES
  ('executives', '[]'::jsonb),
  ('statuses', '["Borrador", "Pendiente", "Aprobada", "En ejecución", "Facturada"]'::jsonb),
  ('currencies', '["CLP", "UF"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

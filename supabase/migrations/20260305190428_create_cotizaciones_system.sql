/*
  # CotiSys - Sistema de Cotizaciones

  ## Tablas creadas

  1. **clientes** - Directorio de clientes
     - id (uuid, primary key)
     - name (text) - Nombre de la empresa
     - rut (text, unique) - RUT chileno
     - email (text)
     - phone (text, opcional)
     - address (text, opcional)
     - created_at (timestamptz)

  2. **cotizaciones** - Cotizaciones principales
     - id (text, primary key) - Ej: COT-105
     - client_id (uuid, FK clientes)
     - executive (text) - Nombre del ejecutivo
     - currency (text) - CLP o UF
     - status (text) - Borrador, Pendiente, Aprobada, En ejecución, Facturada
     - requirement (text, opcional) - N° requerimiento
     - version (integer) - Número de versión actual
     - created_at (timestamptz)
     - updated_at (timestamptz)

  3. **cotizacion_items** - Items de línea de cada cotización
     - id (uuid, primary key)
     - cotizacion_id (text, FK cotizaciones)
     - service (text)
     - description (text)
     - quantity (integer)
     - unit_price (numeric)
     - created_at (timestamptz)

  4. **cotizacion_versiones** - Historial de versiones
     - id (uuid, primary key)
     - cotizacion_id (text, FK cotizaciones)
     - version (integer)
     - status (text) - Vigente, Reemplazada
     - created_at (timestamptz)

  5. **tickets** - Tickets de trabajo vinculados a cotizaciones
     - id (text, primary key) - Ej: TK-301
     - cotizacion_id (text, FK cotizaciones)
     - client_name (text)
     - assigned (text)
     - status (text) - En progreso, Cerrado
     - created_at (timestamptz)

  6. **documentos** - Documentos adjuntos a cotizaciones
     - id (uuid, primary key)
     - cotizacion_id (text, FK cotizaciones)
     - name (text) - Nombre del archivo
     - type (text) - Aprobación, Orden de Compra, Factura
     - url (text, opcional)
     - created_at (timestamptz)

  7. **configuracion** - Configuración general del sistema (tabla singleton)
     - id (integer, primary key, default 1)
     - company_name (text)
     - company_rut (text)
     - tickets_url (text)
     - updated_at (timestamptz)

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas de acceso público para lectura/escritura (sin autenticación requerida por ahora)

  ## Datos iniciales
  - Se insertan los datos de demo para todas las tablas
*/

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rut text UNIQUE NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read clientes"
  ON clientes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert clientes"
  ON clientes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update clientes"
  ON clientes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete clientes"
  ON clientes FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================
-- COTIZACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
  id text PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  executive text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'CLP',
  status text NOT NULL DEFAULT 'Borrador',
  requirement text DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cotizaciones"
  ON cotizaciones FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert cotizaciones"
  ON cotizaciones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update cotizaciones"
  ON cotizaciones FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete cotizaciones"
  ON cotizaciones FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================
-- COTIZACION ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id text NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  service text NOT NULL DEFAULT '',
  description text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cotizacion_items"
  ON cotizacion_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert cotizacion_items"
  ON cotizacion_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update cotizacion_items"
  ON cotizacion_items FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete cotizacion_items"
  ON cotizacion_items FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================
-- COTIZACION VERSIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS cotizacion_versiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id text NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Vigente',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cotizacion_versiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cotizacion_versiones"
  ON cotizacion_versiones FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert cotizacion_versiones"
  ON cotizacion_versiones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update cotizacion_versiones"
  ON cotizacion_versiones FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete cotizacion_versiones"
  ON cotizacion_versiones FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id text PRIMARY KEY,
  cotizacion_id text REFERENCES cotizaciones(id) ON DELETE SET NULL,
  client_name text NOT NULL DEFAULT '',
  assigned text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'En progreso',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tickets"
  ON tickets FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert tickets"
  ON tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update tickets"
  ON tickets FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete tickets"
  ON tickets FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================
-- DOCUMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id text NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read documentos"
  ON documentos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert documentos"
  ON documentos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update documentos"
  ON documentos FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete documentos"
  ON documentos FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================
-- CONFIGURACION (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion (
  id integer PRIMARY KEY DEFAULT 1,
  company_name text NOT NULL DEFAULT 'Mi Empresa TI SpA',
  company_rut text NOT NULL DEFAULT '76.000.000-0',
  tickets_url text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read configuracion"
  ON configuracion FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert configuracion"
  ON configuracion FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update configuracion"
  ON configuracion FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO clientes (id, name, rut, email, phone) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Empresa ABC', '76.123.456-7', 'contacto@empresaabc.cl', '+56 9 1234 5678'),
  ('a1000000-0000-0000-0000-000000000002', 'Tech Solutions SpA', '76.987.654-3', 'info@techsolutions.cl', ''),
  ('a1000000-0000-0000-0000-000000000003', 'Innovatech Ltda', '76.555.333-1', 'ventas@innovatech.cl', ''),
  ('a1000000-0000-0000-0000-000000000004', 'Global Services', '76.444.222-K', 'admin@globalservices.cl', ''),
  ('a1000000-0000-0000-0000-000000000005', 'DataCorp SA', '76.111.999-5', 'contacto@datacorp.cl', ''),
  ('a1000000-0000-0000-0000-000000000006', 'SecureNet Chile', '76.222.888-0', 'soporte@securenet.cl', '')
ON CONFLICT (rut) DO NOTHING;

INSERT INTO cotizaciones (id, client_id, executive, currency, status, requirement, version, created_at) VALUES
  ('COT-105', 'a1000000-0000-0000-0000-000000000001', 'Juan Pérez', 'CLP', 'Aprobada', 'REQ-042', 2, '2026-03-04T00:00:00Z'),
  ('COT-104', 'a1000000-0000-0000-0000-000000000002', 'María García', 'UF', 'En ejecución', '', 2, '2026-03-02T00:00:00Z'),
  ('COT-103', 'a1000000-0000-0000-0000-000000000003', 'Juan Pérez', 'CLP', 'Pendiente', '', 3, '2026-02-28T00:00:00Z'),
  ('COT-102', 'a1000000-0000-0000-0000-000000000004', 'María García', 'CLP', 'Facturada', '', 1, '2026-02-25T00:00:00Z'),
  ('COT-101', 'a1000000-0000-0000-0000-000000000005', 'Juan Pérez', 'UF', 'En ejecución', '', 1, '2026-02-20T00:00:00Z'),
  ('COT-100', 'a1000000-0000-0000-0000-000000000006', 'María García', 'CLP', 'Borrador', '', 1, '2026-02-18T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cotizacion_items (cotizacion_id, service, description, quantity, unit_price) VALUES
  ('COT-105', 'Instalación de red', 'Cableado estructurado Cat6', 1, 1500000),
  ('COT-105', 'Configuración firewall', 'FortiGate 60F', 1, 650000),
  ('COT-105', 'Soporte técnico', 'Soporte remoto 3 meses', 3, 100000);

INSERT INTO cotizacion_versiones (cotizacion_id, version, status) VALUES
  ('COT-105', 1, 'Reemplazada'),
  ('COT-105', 2, 'Vigente'),
  ('COT-104', 1, 'Reemplazada'),
  ('COT-104', 2, 'Vigente'),
  ('COT-103', 1, 'Reemplazada'),
  ('COT-103', 2, 'Reemplazada'),
  ('COT-103', 3, 'Vigente'),
  ('COT-102', 1, 'Vigente'),
  ('COT-101', 1, 'Vigente'),
  ('COT-100', 1, 'Vigente');

INSERT INTO tickets (id, cotizacion_id, client_name, assigned, status, created_at) VALUES
  ('TK-301', 'COT-104', 'Tech Solutions SpA', 'Carlos Técnico', 'En progreso', '2026-03-03T00:00:00Z'),
  ('TK-300', 'COT-101', 'DataCorp SA', 'Pedro Técnico', 'En progreso', '2026-02-21T00:00:00Z'),
  ('TK-299', NULL, 'Empresa ABC', 'Carlos Técnico', 'Cerrado', '2026-02-15T00:00:00Z'),
  ('TK-298', NULL, 'Innovatech Ltda', 'Pedro Técnico', 'Cerrado', '2026-02-10T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO documentos (cotizacion_id, name, type, created_at) VALUES
  ('COT-105', 'Aprobación COT-105.pdf', 'Aprobación', '2026-03-04T00:00:00Z'),
  ('COT-104', 'OC_TechSolutions_2026.pdf', 'Orden de Compra', '2026-03-03T00:00:00Z'),
  ('COT-102', 'Factura_102.pdf', 'Factura', '2026-02-26T00:00:00Z'),
  ('COT-101', 'Aprobacion_email.png', 'Aprobación', '2026-02-20T00:00:00Z');

INSERT INTO configuracion (id, company_name, company_rut, tickets_url) VALUES
  (1, 'Mi Empresa TI SpA', '76.000.000-0', '')
ON CONFLICT (id) DO NOTHING;

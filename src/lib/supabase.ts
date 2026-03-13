// Tipos del dominio — el cliente Supabase fue reemplazado por src/lib/api.ts

export type Cliente = {
  id: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
};

export type Cotizacion = {
  id: string;
  client_id: string;
  executive: string;
  currency: string;
  status: string;
  requirement: string;
  requester_name: string | null;
  version: number;
  uf_value: number | null;
  validity_days: number;
  created_at: string;
  updated_at: string;
  clientes?: Cliente;
};

export type CotizacionItem = {
  id: string;
  cotizacion_id: string;
  service: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  category: string;
  rental_period: string | null;
  rental_from: string | null;
  rental_to: string | null;
  created_at: string;
};

export type CotizacionVersion = {
  id: string;
  cotizacion_id: string;
  version: number;
  status: string;
  created_at: string;
  items_snapshot: CotizacionItem[] | null;
  total: number | null;
  currency: string | null;
  executive: string | null;
  requirement: string | null;
  requester_name: string | null;
  uf_value: number | null;
};

export type Ticket = {
  id: string;
  cotizacion_id: string | null;
  client_name: string;
  assigned: string;
  status: string;
  created_at: string;
};

export type Documento = {
  id: string;
  cotizacion_id: string;
  name: string;
  type: string;
  url: string;
  created_at: string;
};

export type Configuracion = {
  id: number;
  company_name: string;
  company_rut: string;
  tickets_url: string;
  ticketera_email: string | null;
  ticketera_password: string | null;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  role: "admin" | "comercial";
  full_name: string;
  created_at: string;
};

export type Producto = {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  currency: "CLP" | "UF";
  category: string;
  created_at: string;
};

export type AppConfig = {
  key: string;
  values: string[];
  updated_at: string;
};

export async function getAppConfigs(keys: string[]): Promise<Record<string, string[]>> {
  const { api } = await import("./api");
  const configs: AppConfig[] = await api.get("/configuracion/app-config");
  return Object.fromEntries(
    configs
      .filter((c) => keys.includes(c.key))
      .map((c) => [c.key, Array.isArray(c.values) ? c.values : []])
  );
}

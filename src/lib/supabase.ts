import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  role: "admin" | "comercial";
  full_name: string;
  created_at: string;
};

export type AppConfig = {
  key: string;
  values: string[];
  updated_at: string;
};

export async function getAppConfigs(keys: string[]): Promise<Record<string, string[]>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? supabaseAnonKey;
  const keysParam = keys.map((k) => `"${k}"`).join(",");
  const url = `${supabaseUrl}/rest/v1/app_config?key=in.(${keysParam})&select=key,values`;
  const res = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return {};
  const rows: { key: string; values: string[] }[] = await res.json();
  return Object.fromEntries(rows.map((r) => [r.key, Array.isArray(r.values) ? r.values : []]));
}

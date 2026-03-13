const BASE_URL = import.meta.env.VITE_TICKETERA_API_URL ?? "https://api-ticketera.siroe.cl";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function loginTicketera(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.mensaje || "Credenciales incorrectas");
  }
  cachedToken = data.token;
  // token válido 7 días, renovar 1 hora antes
  tokenExpiry = Date.now() + (7 * 24 * 60 - 60) * 60 * 1000;
  return data.token;
}

export async function getToken(email: string, password: string): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  return loginTicketera(email, password);
}

export function clearToken() {
  cachedToken = null;
  tokenExpiry = null;
}

export interface TicketeraTicket {
  id: number;
  titulo: string | null;
  descripcion: string;
  estadoTicket: string;
  prioridad: "Baja" | "Media" | "Alta";
  isEmergencia: boolean;
  fechaVisita: string;
  fechaTermino: string | null;
  tecnicoAsignado: { id: number; name: string; email: string } | null;
  casaMatriz: { id: string; razonSocial: string } | null;
  tags: { id: number; nombre: string; color: string }[];
  createdAt: string;
}

export interface TicketeraListResponse {
  data: TicketeraTicket[];
  total: number;
  pagina: number;
  paginasTotales: number;
}

export async function fetchTickets(
  token: string,
  params: {
    pagina?: number;
    limit?: number;
    search?: string;
    estadoTicket?: string;
  } = {}
): Promise<TicketeraListResponse> {
  const query = new URLSearchParams();
  if (params.pagina) query.set("pagina", String(params.pagina));
  query.set("limit", String(params.limit ?? 15));
  if (params.search) query.set("search", params.search);
  if (params.estadoTicket) query.set("estadoTicket", params.estadoTicket);

  const res = await fetch(`${BASE_URL}/tickets?${query.toString()}`, {
    headers: { token },
  });
  if (!res.ok) throw new Error("Error al obtener tickets");
  return res.json();
}

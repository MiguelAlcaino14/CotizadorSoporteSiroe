import { useEffect, useState, useCallback } from "react";
import { Search, Ticket, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getToken, fetchTickets, clearToken, type TicketeraTicket } from "@/lib/ticketeraApi";
import { toast } from "sonner";

const ESTADOS = ["Todos", "Nuevo", "Abierto", "Cerrado"];
const PAGE_SIZE = 15;

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    Nuevo: "bg-blue-100 text-blue-700 border-blue-200",
    Abierto: "bg-amber-100 text-amber-700 border-amber-200",
    Cerrado: "bg-green-100 text-green-700 border-green-200",
  };
  return map[estado] ?? "bg-muted text-muted-foreground border-border";
}

function prioridadBadge(prioridad: string) {
  const map: Record<string, string> = {
    Alta: "bg-red-100 text-red-700 border-red-200",
    Media: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Baja: "bg-green-100 text-green-700 border-green-200",
  };
  return map[prioridad] ?? "bg-muted text-muted-foreground";
}

function fmtDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Tickets() {
  const [tickets, setTickets] = useState<TicketeraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noConfig, setNoConfig] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load credentials from configuracion
  useEffect(() => {
    api.get<any>("/configuracion").then((data) => {
      const email = data?.ticketeraEmail ?? data?.ticketera_email;
      const password = data?.ticketeraPassword ?? data?.ticketera_password;
      if (email && password) {
        setCreds({ email, password });
      } else {
        setNoConfig(true);
        setLoading(false);
      }
    }).catch(() => { setNoConfig(true); setLoading(false); });
  }, []);

  const loadTickets = useCallback(async () => {
    if (!creds) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken(creds.email, creds.password);
      const res = await fetchTickets(token, {
        pagina,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        estadoTicket: estadoFilter !== "Todos" ? estadoFilter : undefined,
      });
      setTickets(res.data);
      setTotal(res.total);
      setPaginasTotales(res.paginasTotales);
    } catch (e: unknown) {
      clearToken();
      const msg = e instanceof Error ? e.message : "Error al conectar con la ticketera";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [creds, pagina, debouncedSearch, estadoFilter]);

  useEffect(() => {
    if (creds) loadTickets();
  }, [creds, loadTickets]);

  // Reset page when filters change
  useEffect(() => { setPagina(1); }, [debouncedSearch, estadoFilter]);

  if (noConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 text-warning" />
        <p className="text-sm font-medium">No hay credenciales configuradas para la ticketera.</p>
        <p className="text-xs">Ve a <strong>Configuración → Integración Ticketera</strong> y agrega tu email y contraseña.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Tickets</h1>
          <p className="page-subheader">
            {loading ? "Cargando..." : `${total} ticket${total !== 1 ? "s" : ""} en total`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={loadTickets} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFilter(e)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                estadoFilter === e
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {error ? (
        <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={loadTickets}>Reintentar</Button>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Cargando tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
          <Ticket className="h-8 w-8" />
          <p className="text-sm">No se encontraron tickets.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">#</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Título</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Cliente</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Estado</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Prioridad</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Técnico</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Fecha visita</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm text-muted-foreground font-mono">#{t.id}</td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground max-w-xs">
                    <span className="line-clamp-2">{t.titulo || t.descripcion}</span>
                    {t.isEmergencia && (
                      <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-red-600 font-medium">
                        <AlertTriangle className="h-3 w-3" /> Emergencia
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {t.casaMatriz?.razonSocial ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(t.estadoTicket)}`}>
                      {t.estadoTicket}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center hidden lg:table-cell">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${prioridadBadge(t.prioridad)}`}>
                      {t.prioridad}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {t.tecnicoAsignado?.name ?? <span className="text-xs italic">Sin asignar</span>}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground text-center hidden md:table-cell">
                    {fmtDate(t.fechaVisita)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://app.soportesiroe.cl/tickets/${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Ver en ticketera"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {paginasTotales > 1 && !loading && !error && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {pagina} de {paginasTotales}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.min(paginasTotales, p + 1))}
              disabled={pagina === paginasTotales}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

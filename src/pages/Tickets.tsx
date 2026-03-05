import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase, type Ticket } from "@/lib/supabase";

const statusColors: Record<string, string> = {
  "En progreso": "bg-info/10 text-info border-info/20",
  Cerrado: "bg-muted text-muted-foreground border-border",
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setTickets(data);
      setLoading(false);
    }
    fetchTickets();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Tickets</h1>
        <p className="page-subheader">Tickets de trabajo generados desde cotizaciones</p>
      </div>
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Ticket ID</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Cotización</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Asignado</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando...</td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">No hay tickets registrados.</td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-mono text-sm font-medium text-primary">{t.id}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{t.cotizacion_id ?? "-"}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{t.client_name}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{t.assigned}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={statusColors[t.status]}>{t.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("es-CL")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { FileText, CircleCheck as CheckCircle, Clock, Receipt, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase, type Cotizacion } from "@/lib/supabase";

const statusColors: Record<string, string> = {
  Aprobada: "bg-success/10 text-success border-success/20",
  "En ejecución": "bg-info/10 text-info border-info/20",
  Pendiente: "bg-warning/10 text-warning border-warning/20",
  Facturada: "bg-muted text-muted-foreground border-border",
  Borrador: "bg-secondary text-secondary-foreground border-border",
};

type Stats = {
  total: number;
  aprobadas: number;
  enEjecucion: number;
  pendientesFacturacion: number;
};

type Activity = {
  text: string;
  time: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentQuotes, setRecentQuotes] = useState<Cotizacion[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, aprobadas: 0, enEjecucion: 0, pendientesFacturacion: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [quotesRes, allRes] = await Promise.all([
        supabase
          .from("cotizaciones")
          .select("*, clientes(name)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("cotizaciones").select("status, created_at"),
      ]);

      if (quotesRes.data) {
        setRecentQuotes(quotesRes.data as Cotizacion[]);
      }

      if (allRes.data) {
        const all = allRes.data;
        setStats({
          total: all.length,
          aprobadas: all.filter((q) => q.status === "Aprobada").length,
          enEjecucion: all.filter((q) => q.status === "En ejecución").length,
          pendientesFacturacion: all.filter((q) => q.status === "Facturada").length,
        });
      }

      const docsRes = await supabase
        .from("documentos")
        .select("name, cotizacion_id, created_at")
        .order("created_at", { ascending: false })
        .limit(4);

      if (docsRes.data) {
        const acts: Activity[] = docsRes.data.map((d) => ({
          text: `Documento "${d.name}" subido para ${d.cotizacion_id}`,
          time: new Date(d.created_at).toLocaleDateString("es-CL"),
        }));
        setActivity(acts);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const formatAmount = (q: Cotizacion) => {
    return q.currency === "UF" ? `UF -` : `$ -`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subheader">Resumen general del sistema de cotizaciones</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Cotizaciones" value={stats.total} icon={FileText} variant="primary" trend="En el sistema" />
        <StatCard title="Aprobadas" value={stats.aprobadas} icon={CheckCircle} variant="success" trend={`${stats.total ? Math.round((stats.aprobadas / stats.total) * 100) : 0}% del total`} />
        <StatCard title="En Ejecución" value={stats.enEjecucion} icon={Clock} variant="info" />
        <StatCard title="Facturadas" value={stats.pendientesFacturacion} icon={Receipt} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold text-foreground">Cotizaciones Recientes</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/cotizaciones")} className="text-primary">
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : recentQuotes.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No hay cotizaciones aún.</div>
            ) : (
              recentQuotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/cotizaciones/${q.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-medium text-primary">{q.id}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{(q as any).clientes?.name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(q.created_at).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColors[q.status]}>
                      {q.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b">
            <h2 className="font-semibold text-foreground">Actividad Reciente</h2>
          </div>
          <div className="p-5 space-y-4">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

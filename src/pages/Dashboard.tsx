import { FileText, CheckCircle, Clock, Receipt, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const recentQuotes = [
  { id: "COT-105", client: "Empresa ABC", amount: "$2.450.000", status: "Aprobada", date: "04/03/2026" },
  { id: "COT-104", client: "Tech Solutions SpA", amount: "UF 45", status: "En ejecución", date: "02/03/2026" },
  { id: "COT-103", client: "Innovatech Ltda", amount: "$890.000", status: "Pendiente", date: "28/02/2026" },
  { id: "COT-102", client: "Global Services", amount: "$3.200.000", status: "Facturada", date: "25/02/2026" },
  { id: "COT-101", client: "DataCorp SA", amount: "UF 120", status: "En ejecución", date: "20/02/2026" },
];

const activity = [
  { text: "Cotización COT-105 aprobada por Empresa ABC", time: "Hace 2 horas" },
  { text: "Ticket TK-301 cerrado para COT-104", time: "Hace 5 horas" },
  { text: "Nueva versión de COT-103 creada (v2)", time: "Hace 1 día" },
  { text: "Factura subida para COT-102", time: "Hace 2 días" },
];

const statusColors: Record<string, string> = {
  Aprobada: "bg-success/10 text-success border-success/20",
  "En ejecución": "bg-info/10 text-info border-info/20",
  Pendiente: "bg-warning/10 text-warning border-warning/20",
  Facturada: "bg-muted text-muted-foreground border-border",
};

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subheader">Resumen general del sistema de cotizaciones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Cotizaciones" value={48} icon={FileText} variant="primary" trend="+5 este mes" />
        <StatCard title="Aprobadas" value={12} icon={CheckCircle} variant="success" trend="25% del total" />
        <StatCard title="En Ejecución" value={8} icon={Clock} variant="info" />
        <StatCard title="Pendientes Facturación" value={4} icon={Receipt} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent quotes */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold text-foreground">Cotizaciones Recientes</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/cotizaciones")} className="text-primary">
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y">
            {recentQuotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-medium text-primary">{q.id}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{q.client}</p>
                    <p className="text-xs text-muted-foreground">{q.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{q.amount}</span>
                  <Badge variant="outline" className={statusColors[q.status]}>
                    {q.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b">
            <h2 className="font-semibold text-foreground">Actividad Reciente</h2>
          </div>
          <div className="p-5 space-y-4">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

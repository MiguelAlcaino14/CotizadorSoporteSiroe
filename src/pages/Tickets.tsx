import { Badge } from "@/components/ui/badge";

const tickets = [
  { id: "TK-301", quote: "COT-104", client: "Tech Solutions SpA", status: "En progreso", assigned: "Carlos Técnico", date: "03/03/2026" },
  { id: "TK-300", quote: "COT-101", client: "DataCorp SA", status: "En progreso", assigned: "Pedro Técnico", date: "21/02/2026" },
  { id: "TK-299", quote: "COT-099", client: "Empresa ABC", status: "Cerrado", assigned: "Carlos Técnico", date: "15/02/2026" },
  { id: "TK-298", quote: "COT-097", client: "Innovatech Ltda", status: "Cerrado", assigned: "Pedro Técnico", date: "10/02/2026" },
];

const statusColors: Record<string, string> = {
  "En progreso": "bg-info/10 text-info border-info/20",
  Cerrado: "bg-muted text-muted-foreground border-border",
};

export default function Tickets() {
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
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3 font-mono text-sm font-medium text-primary">{t.id}</td>
                <td className="px-5 py-3 text-sm text-foreground">{t.quote}</td>
                <td className="px-5 py-3 text-sm text-foreground">{t.client}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{t.assigned}</td>
                <td className="px-5 py-3"><Badge variant="outline" className={statusColors[t.status]}>{t.status}</Badge></td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

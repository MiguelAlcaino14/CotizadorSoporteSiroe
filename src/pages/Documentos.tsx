import { FileText, Image, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const docs = [
  { name: "Aprobación COT-105.pdf", type: "Aprobación", quote: "COT-105", date: "04/03/2026", icon: FileText },
  { name: "OC_TechSolutions_2026.pdf", type: "Orden de Compra", quote: "COT-104", date: "03/03/2026", icon: File },
  { name: "Factura_102.pdf", type: "Factura", quote: "COT-102", date: "26/02/2026", icon: FileText },
  { name: "Aprobacion_email.png", type: "Aprobación", quote: "COT-101", date: "20/02/2026", icon: Image },
];

const typeColors: Record<string, string> = {
  Aprobación: "bg-success/10 text-success border-success/20",
  "Orden de Compra": "bg-info/10 text-info border-info/20",
  Factura: "bg-warning/10 text-warning border-warning/20",
};

export default function Documentos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Documentos</h1>
        <p className="page-subheader">Documentos asociados a cotizaciones</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((d, i) => (
          <div key={i} className="bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <d.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.quote} • {d.date}</p>
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="outline" className={typeColors[d.type]}>{d.type}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

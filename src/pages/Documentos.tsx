import { useEffect, useState } from "react";
import { FileText, Image, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase, type Documento } from "@/lib/supabase";

const typeColors: Record<string, string> = {
  Aprobación: "bg-success/10 text-success border-success/20",
  "Orden de Compra": "bg-info/10 text-info border-info/20",
  Factura: "bg-warning/10 text-warning border-warning/20",
};

function getIcon(name: string) {
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return Image;
  if (name.endsWith(".pdf")) return FileText;
  return File;
}

export default function Documentos() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      const { data } = await supabase
        .from("documentos")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setDocs(data);
      setLoading(false);
    }
    fetchDocs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Documentos</h1>
        <p className="page-subheader">Documentos asociados a cotizaciones</p>
      </div>
      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No hay documentos registrados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => {
            const Icon = getIcon(d.name);
            return (
              <div key={d.id} className="bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.cotizacion_id} • {new Date(d.created_at).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className={typeColors[d.type] ?? ""}>{d.type}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

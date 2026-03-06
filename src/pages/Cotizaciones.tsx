import { useState, useEffect } from "react";
import { Plus, Search, Filter, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase, type Cotizacion } from "@/lib/supabase";

const statusColors: Record<string, string> = {
  Aprobada: "bg-success/10 text-success border-success/20",
  "En ejecución": "bg-info/10 text-info border-info/20",
  Pendiente: "bg-warning/10 text-warning border-warning/20",
  Facturada: "bg-muted text-muted-foreground border-border",
  Borrador: "bg-secondary text-secondary-foreground border-border",
};

type CotizacionWithCliente = Cotizacion & { clientes: { name: string } | null };

export default function Cotizaciones() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quotes, setQuotes] = useState<CotizacionWithCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CotizacionWithCliente | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchQuotes() {
      const { data } = await supabase
        .from("cotizaciones")
        .select("*, clientes(name)")
        .order("created_at", { ascending: false });
      if (data) setQuotes(data as CotizacionWithCliente[]);
      setLoading(false);
    }
    fetchQuotes();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("cotizaciones").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Error al eliminar la cotización");
      setDeleting(false);
      return;
    }
    setQuotes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
    toast.success(`Cotización ${deleteTarget.id} eliminada`);
    setDeleteTarget(null);
    setDeleting(false);
  };

  const filtered = quotes.filter((q) => {
    const clientName = q.clientes?.name ?? "";
    const matchesSearch =
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Cotizaciones</h1>
          <p className="page-subheader">Gestiona todas las cotizaciones del sistema</p>
        </div>
        <Button onClick={() => navigate("/cotizaciones/nueva")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Borrador">Borrador</SelectItem>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Aprobada">Aprobada</SelectItem>
            <SelectItem value="En ejecución">En ejecución</SelectItem>
            <SelectItem value="Facturada">Facturada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">N° Cotización</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ejecutivo</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Moneda</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Versión</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-muted-foreground">No se encontraron cotizaciones.</td>
              </tr>
            ) : (
              filtered.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/cotizaciones/${q.id}`)}
                >
                  <td className="px-5 py-3 font-mono text-sm font-medium text-primary">{q.id}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{q.clientes?.name ?? "-"}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{q.executive}</td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{q.currency}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">v{q.version}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={statusColors[q.status]}>{q.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(q.created_at).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/cotizaciones/${q.id}/editar`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(q)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cotización {deleteTarget?.id}</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los items, versiones y documentos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

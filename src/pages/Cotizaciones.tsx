import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
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

const quotes = [
  { id: "COT-105", client: "Empresa ABC", executive: "Juan Pérez", amount: "$2.450.000", currency: "CLP", status: "Aprobada", version: 1, date: "04/03/2026" },
  { id: "COT-104", client: "Tech Solutions SpA", executive: "María García", amount: "UF 45", currency: "UF", status: "En ejecución", version: 2, date: "02/03/2026" },
  { id: "COT-103", client: "Innovatech Ltda", executive: "Juan Pérez", amount: "$890.000", currency: "CLP", status: "Pendiente", version: 3, date: "28/02/2026" },
  { id: "COT-102", client: "Global Services", executive: "María García", amount: "$3.200.000", currency: "CLP", status: "Facturada", version: 1, date: "25/02/2026" },
  { id: "COT-101", client: "DataCorp SA", executive: "Juan Pérez", amount: "UF 120", currency: "UF", status: "En ejecución", version: 1, date: "20/02/2026" },
  { id: "COT-100", client: "SecureNet Chile", executive: "María García", amount: "$1.750.000", currency: "CLP", status: "Borrador", version: 1, date: "18/02/2026" },
];

const statusColors: Record<string, string> = {
  Aprobada: "bg-success/10 text-success border-success/20",
  "En ejecución": "bg-info/10 text-info border-info/20",
  Pendiente: "bg-warning/10 text-warning border-warning/20",
  Facturada: "bg-muted text-muted-foreground border-border",
  Borrador: "bg-secondary text-secondary-foreground border-border",
};

export default function Cotizaciones() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = quotes.filter((q) => {
    const matchesSearch =
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.client.toLowerCase().includes(search.toLowerCase());
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
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Versión</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((q) => (
              <tr
                key={q.id}
                className="hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/cotizaciones/${q.id}`)}
              >
                <td className="px-5 py-3 font-mono text-sm font-medium text-primary">{q.id}</td>
                <td className="px-5 py-3 text-sm text-foreground">{q.client}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{q.executive}</td>
                <td className="px-5 py-3 text-sm font-medium text-foreground">{q.amount}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">v{q.version}</td>
                <td className="px-5 py-3">
                  <Badge variant="outline" className={statusColors[q.status]}>{q.status}</Badge>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{q.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

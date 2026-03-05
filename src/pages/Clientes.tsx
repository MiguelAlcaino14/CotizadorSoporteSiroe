import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const clients = [
  { name: "Empresa ABC", rut: "76.123.456-7", email: "contacto@empresaabc.cl", quotes: 5, lastQuote: "04/03/2026" },
  { name: "Tech Solutions SpA", rut: "76.987.654-3", email: "info@techsolutions.cl", quotes: 3, lastQuote: "02/03/2026" },
  { name: "Innovatech Ltda", rut: "76.555.333-1", email: "ventas@innovatech.cl", quotes: 8, lastQuote: "28/02/2026" },
  { name: "Global Services", rut: "76.444.222-K", email: "admin@globalservices.cl", quotes: 2, lastQuote: "25/02/2026" },
  { name: "DataCorp SA", rut: "76.111.999-5", email: "contacto@datacorp.cl", quotes: 4, lastQuote: "20/02/2026" },
  { name: "SecureNet Chile", rut: "76.222.888-0", email: "soporte@securenet.cl", quotes: 1, lastQuote: "18/02/2026" },
];

export default function Clientes() {
  const [search, setSearch] = useState("");
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.rut.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Clientes</h1>
          <p className="page-subheader">Directorio de clientes</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Cliente</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.rut} className="bg-card rounded-xl border shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{c.rut}</p>
              </div>
              <Badge variant="secondary">{c.quotes} cot.</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{c.email}</p>
            <p className="text-xs text-muted-foreground">Última cotización: {c.lastQuote}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase, type Cliente } from "@/lib/supabase";

type ClienteWithCount = Cliente & { quotes: number };

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState<ClienteWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", rut: "", email: "", phone: "", address: "" });

  async function fetchClientes() {
    const { data: clientesData } = await supabase.from("clientes").select("*").order("name");
    const { data: cotizacionesData } = await supabase.from("cotizaciones").select("client_id");

    if (clientesData) {
      const countMap: Record<string, number> = {};
      (cotizacionesData ?? []).forEach((c) => {
        countMap[c.client_id] = (countMap[c.client_id] ?? 0) + 1;
      });
      setClientes(
        clientesData.map((c) => ({ ...c, quotes: countMap[c.id] ?? 0 }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  const filtered = clientes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.rut.includes(search)
  );

  const handleSave = async () => {
    if (!form.name || !form.rut || !form.email) {
      toast.error("Nombre, RUT y correo son obligatorios");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("clientes").insert({
      name: form.name,
      rut: form.rut,
      email: form.email,
      phone: form.phone,
      address: form.address,
    });
    if (error) {
      toast.error(error.code === "23505" ? "El RUT ya existe" : "Error al guardar el cliente");
      setSaving(false);
      return;
    }
    toast.success(`Cliente ${form.name} creado`);
    setShowModal(false);
    setForm({ name: "", rut: "", email: "", phone: "", address: "" });
    await fetchClientes();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Clientes</h1>
          <p className="page-subheader">Directorio de clientes</p>
        </div>
        <Button className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No se encontraron clientes.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.rut}</p>
                </div>
                <Badge variant="secondary">{c.quotes} cot.</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{c.email}</p>
              {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
              <p className="text-xs text-muted-foreground">
                Registrado: {new Date(c.created_at).toLocaleDateString("es-CL")}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre de la empresa *</Label>
              <Input
                placeholder="Razón social"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>RUT *</Label>
              <Input
                placeholder="XX.XXX.XXX-X"
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico *</Label>
              <Input
                type="email"
                placeholder="correo@empresa.cl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                placeholder="+56 9 XXXX XXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input
                placeholder="Dirección (opcional)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

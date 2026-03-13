import { Search, Plus, Pencil, Trash2 } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase, type Cliente } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type ClienteWithCount = Cliente & { quotes: number };
type ClienteForm = { name: string; rut: string; email: string; phone: string; address: string };

const emptyForm: ClienteForm = { name: "", rut: "", email: "", phone: "", address: "" };

export default function Clientes() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState<ClienteWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClienteForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClienteWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchClientes() {
    const { data: clientesData } = await supabase.from("clientes").select("*").order("name");
    const { data: cotizacionesData } = await supabase.from("cotizaciones").select("client_id");
    if (clientesData) {
      const countMap: Record<string, number> = {};
      (cotizacionesData ?? []).forEach((c) => {
        countMap[c.client_id] = (countMap[c.client_id] ?? 0) + 1;
      });
      setClientes(clientesData.map((c) => ({ ...c, quotes: countMap[c.id] ?? 0 })));
    }
    setLoading(false);
  }

  useEffect(() => { fetchClientes(); }, []);

  const filtered = clientes.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.rut.includes(search)
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: ClienteWithCount) => {
    setEditingId(c.id);
    setForm({ name: c.name, rut: c.rut, email: c.email || "", phone: c.phone || "", address: c.address || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.rut || !form.email) {
      toast.error("Nombre, RUT y correo son obligatorios");
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from("clientes").update({
        name: form.name, rut: form.rut, email: form.email, phone: form.phone, address: form.address,
      }).eq("id", editingId);
      if (error) { toast.error("Error al actualizar el cliente"); setSaving(false); return; }
      toast.success(`Cliente ${form.name} actualizado`);
    } else {
      const { error } = await supabase.from("clientes").insert({
        name: form.name, rut: form.rut, email: form.email, phone: form.phone, address: form.address,
      });
      if (error) {
        toast.error(error.code === "23505" ? "El RUT ya existe" : "Error al guardar el cliente");
        setSaving(false);
        return;
      }
      toast.success(`Cliente ${form.name} creado`);
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    await fetchClientes();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("clientes").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Error al eliminar el cliente"); setDeleting(false); return; }
    toast.success(`Cliente ${deleteTarget.name} eliminado`);
    setDeleteTarget(null);
    setDeleting(false);
    await fetchClientes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Clientes</h1>
          <p className="page-subheader">Directorio de clientes</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
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
            <div key={c.id} className="bg-card rounded-xl border shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.rut}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Badge variant="secondary">{c.quotes} cot.</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
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
            <DialogTitle>{editingId ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Razon social *", key: "name", placeholder: "Razón social" },
              { label: "RUT *", key: "rut", placeholder: "XX.XXX.XXX-X" },
              { label: "Correo electrónico *", key: "email", placeholder: "correo@empresa.cl", type: "email" },
              { label: "Teléfono", key: "phone", placeholder: "+56 9 XXXX XXXX" },
              { label: "Dirección", key: "address", placeholder: "Dirección (opcional)" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type={type ?? "text"}
                  placeholder={placeholder}
                  value={form[key as keyof ClienteForm]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

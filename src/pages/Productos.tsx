import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, type Producto } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const PRODUCT_CATEGORIES = ["Servicio", "Arriendo de Equipos", "Producto", "Licencia / Software"] as const;

type ProductoForm = { name: string; description: string; unit_price: string; currency: "CLP" | "UF"; category: string };
const emptyForm: ProductoForm = { name: "", description: "", unit_price: "", currency: "CLP", category: "Servicio" };

export default function Productos() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductoForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchProductos() {
    const { data } = await supabase.from("productos").select("*").order("name");
    if (data) setProductos(data as Producto[]);
    setLoading(false);
  }

  useEffect(() => { fetchProductos(); }, []);

  const filtered = productos.filter(
    (p) =>
      (categoryFilter === "Todos" || p.category === categoryFilter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (p: Producto) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description, unit_price: String(p.unit_price), currency: p.currency, category: p.category || "Servicio" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.unit_price) { toast.error("Nombre y precio son obligatorios"); return; }
    const price = parseFloat(form.unit_price);
    if (isNaN(price) || price < 0) { toast.error("Precio inválido"); return; }

    setSaving(true);
    const payload = { name: form.name, description: form.description, unit_price: price, currency: form.currency, category: form.category };

    if (editingId) {
      const { error } = await supabase.from("productos").update(payload).eq("id", editingId);
      if (error) { toast.error("Error al actualizar el producto"); setSaving(false); return; }
      toast.success(`Producto "${form.name}" actualizado`);
    } else {
      const { error } = await supabase.from("productos").insert(payload);
      if (error) { toast.error("Error al crear el producto"); setSaving(false); return; }
      toast.success(`Producto "${form.name}" creado`);
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    await fetchProductos();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("productos").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Error al eliminar el producto"); setDeleting(false); return; }
    toast.success(`Producto "${deleteTarget.name}" eliminado`);
    setDeleteTarget(null);
    setDeleting(false);
    await fetchProductos();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Productos / Servicios</h1>
          <p className="page-subheader">Catálogo de productos y servicios para cotizaciones</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["Todos", ...PRODUCT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
          <Package className="h-8 w-8" />
          <p className="text-sm">No se encontraron productos.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Descripción</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Categoría</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Precio</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase w-24">Moneda</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{p.name}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{p.description || "-"}</td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <Badge variant="secondary" className="text-xs">{p.category || "Servicio"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-foreground">
                    {p.currency === "UF"
                      ? `UF ${p.unit_price.toLocaleString("es-CL")}`
                      : `$${p.unit_price.toLocaleString("es-CL")}`}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant="outline" className="text-xs">{p.currency}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear / editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Soporte Técnico Mensual" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input placeholder="Descripción breve del producto o servicio" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio unitario *</Label>
                <Input
                  type="number"
                  min={0}
                  step={form.currency === "UF" ? "0.0001" : "1"}
                  placeholder="0"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v as "CLP" | "UF" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP ($)</SelectItem>
                    <SelectItem value="UF">UF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal eliminar */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
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

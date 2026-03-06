import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Info, UserPlus, FileDown, Loader as Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase, type Cliente } from "@/lib/supabase";
import { generateCotizacionPDF } from "@/lib/generateCotizacionPDF";

const IVA = 0.19;

interface LineItem {
  id: number;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: "CLP" | "UF";
}

interface NuevoClienteForm {
  name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
}

function itemTotalCLP(item: LineItem, ufValue: number): number {
  const base = item.quantity * item.unitPrice;
  return item.currency === "UF" ? base * ufValue : base;
}

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const [executive, setExecutive] = useState("Juan Pérez");
  const [requirement, setRequirement] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nextId, setNextId] = useState("COT-001");
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [ufValue, setUfValue] = useState<number>(0);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [savingCliente, setSavingCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState<NuevoClienteForm>({
    name: "",
    rut: "",
    email: "",
    phone: "",
    address: "",
  });
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, service: "", description: "", quantity: 1, unitPrice: 0, currency: "CLP" },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [clientesRes, cotizacionesRes] = await Promise.all([
      supabase.from("clientes").select("*").order("name"),
      supabase.from("cotizaciones").select("id").order("id", { ascending: false }).limit(1),
    ]);
    if (clientesRes.data) setClientes(clientesRes.data);
    if (cotizacionesRes.data && cotizacionesRes.data.length > 0) {
      const lastId = cotizacionesRes.data[0].id;
      const num = parseInt(lastId.replace("COT-", ""), 10);
      setNextId(`COT-${String(num + 1).padStart(3, "0")}`);
    }
  }

  const addItem = () => {
    setItems([...items, { id: Date.now(), service: "", description: "", quantity: 1, unitPrice: 0, currency: "CLP" }]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: number, field: keyof LineItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const hasUFItems = items.some((i) => i.currency === "UF");

  const netTotal = items.reduce((sum, i) => sum + itemTotalCLP(i, ufValue), 0);
  const ivaAmount = netTotal * IVA;
  const grandTotal = netTotal + ivaAmount;

  const selectedCliente = clientes.find((c) => c.id === clientId);

  const handleGuardarNuevoCliente = async () => {
    if (!nuevoCliente.name || !nuevoCliente.rut) {
      toast.error("Nombre y RUT son obligatorios");
      return;
    }
    setSavingCliente(true);
    const { data, error } = await supabase
      .from("clientes")
      .insert(nuevoCliente)
      .select()
      .maybeSingle();
    if (error) {
      toast.error("Error al crear el cliente");
      setSavingCliente(false);
      return;
    }
    if (data) {
      setClientes((prev) => [...prev, data as Cliente].sort((a, b) => a.name.localeCompare(b.name)));
      setClientId(data.id);
      toast.success(`Cliente ${data.name} creado`);
    }
    setShowNuevoClienteModal(false);
    setNuevoCliente({ name: "", rut: "", email: "", phone: "", address: "" });
    setSavingCliente(false);
  };

  const handleGenerarPDF = () => {
    if (!clientId || !selectedCliente) {
      toast.error("Selecciona un cliente antes de generar el PDF");
      return;
    }
    if (hasUFItems && ufValue <= 0) {
      toast.error("Ingresa el valor de la UF para generar el PDF");
      return;
    }
    setGeneratingPDF(true);
    try {
      generateCotizacionPDF({
        cotizacionId: nextId,
        cliente: selectedCliente,
        executive,
        requirement,
        items,
        ufValue,
        netTotal,
        ivaAmount,
        grandTotal,
      });
      toast.success(`PDF ${nextId}.pdf descargado`);
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (hasUFItems && ufValue <= 0) {
      toast.error("Ingresa el valor de la UF");
      return;
    }
    setSaving(true);

    const { error: cotError } = await supabase.from("cotizaciones").insert({
      id: nextId,
      client_id: clientId,
      executive,
      currency: hasUFItems ? "MIXTO" : "CLP",
      status: "Borrador",
      requirement,
      version: 1,
    });

    if (cotError) {
      toast.error("Error al crear la cotización");
      setSaving(false);
      return;
    }

    const itemsToInsert = items.map((i) => ({
      cotizacion_id: nextId,
      service: i.service,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      currency: i.currency,
    }));

    const { error: itemsError } = await supabase.from("cotizacion_items").insert(itemsToInsert);
    if (itemsError) {
      toast.error("Error al guardar los items");
      setSaving(false);
      return;
    }

    await supabase.from("cotizacion_versiones").insert({
      cotizacion_id: nextId,
      version: 1,
      status: "Vigente",
      items_snapshot: itemsToInsert.map((i) => ({ ...i, id: "", created_at: "" })),
      total: grandTotal,
      currency: hasUFItems ? "MIXTO" : "CLP",
      executive,
      requirement,
    });

    toast.success(`Cotización ${nextId} creada exitosamente`);
    navigate("/cotizaciones");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="page-header">Nueva Cotización</h1>
          <p className="page-subheader">{nextId} • Borrador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Cliente</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowNuevoClienteModal(true)}
            >
              <UserPlus className="h-4 w-4" /> Nuevo cliente
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label>Seleccionar cliente existente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.rut}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Información de la Cotización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>N° Requerimiento (opcional)</Label>
              <Input
                placeholder="REQ-XXX"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ejecutivo responsable</Label>
              <Select value={executive} onValueChange={setExecutive}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
                  <SelectItem value="María García">María García</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor UF (CLP)</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ej: 38500"
                value={ufValue || ""}
                onChange={(e) => setUfValue(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Requerido si algún ítem se cotiza en UF
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Servicios / Productos</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="h-4 w-4" /> Agregar ítem
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-muted/30 border">
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Servicio/Producto</Label>}
                  <Input
                    placeholder="Servicio"
                    value={item.service}
                    onChange={(e) => updateItem(item.id, "service", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Descripción</Label>}
                  <Input
                    placeholder="Descripción"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  {idx === 0 && <Label className="text-xs">Cant.</Label>}
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Moneda</Label>}
                  <Select
                    value={item.currency}
                    onValueChange={(v) => {
                      updateItem(item.id, "currency", v);
                      if (v === "UF") updateItem(item.id, "unitPrice", 0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP</SelectItem>
                      <SelectItem value="UF">UF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Valor Unit.</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={item.currency === "UF" ? "" : item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    disabled={item.currency === "UF"}
                    placeholder={item.currency === "UF" ? "—" : "0"}
                    required={item.currency !== "UF"}
                  />
                </div>
                <div className="col-span-1 flex justify-center pt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">Neto</span>
              <span className="font-medium text-foreground w-32 text-right">
                ${netTotal.toLocaleString("es-CL")}
              </span>
            </div>
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">IVA (19%)</span>
              <span className="font-medium text-foreground w-32 text-right">
                ${ivaAmount.toLocaleString("es-CL")}
              </span>
            </div>
            <div className="flex justify-end gap-8 border-t pt-2">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground w-32 text-right">
                ${grandTotal.toLocaleString("es-CL")}
              </span>
            </div>
            {hasUFItems && ufValue > 0 && (
              <p className="text-right text-xs text-muted-foreground">
                Valor UF utilizado: ${ufValue.toLocaleString("es-CL")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 p-4 rounded-lg bg-accent text-accent-foreground text-sm border border-primary/10">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          La validez de esta cotización es de 5 días desde la fecha de emisión. Los precios incluyen IVA (19%).
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/cotizaciones")}>
            Cancelar
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handleGenerarPDF} disabled={generatingPDF}>
            {generatingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {generatingPDF ? "Generando..." : "Generar PDF"}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear Cotización"}
          </Button>
        </div>
      </form>

      <Dialog open={showNuevoClienteModal} onOpenChange={setShowNuevoClienteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre / Razón Social <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Empresa Ejemplo S.A."
                value={nuevoCliente.name}
                onChange={(e) => setNuevoCliente((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>RUT <span className="text-destructive">*</span></Label>
              <Input
                placeholder="12.345.678-9"
                value={nuevoCliente.rut}
                onChange={(e) => setNuevoCliente((p) => ({ ...p, rut: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="contacto@empresa.cl"
                value={nuevoCliente.email}
                onChange={(e) => setNuevoCliente((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                placeholder="+56 9 1234 5678"
                value={nuevoCliente.phone}
                onChange={(e) => setNuevoCliente((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input
                placeholder="Av. Ejemplo 123, Santiago"
                value={nuevoCliente.address}
                onChange={(e) => setNuevoCliente((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNuevoClienteModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarNuevoCliente} disabled={savingCliente}>
              {savingCliente ? "Guardando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

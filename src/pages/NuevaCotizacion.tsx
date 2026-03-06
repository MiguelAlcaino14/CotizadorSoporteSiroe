import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, type Cliente } from "@/lib/supabase";
import { generateCotizacionPDF } from "@/lib/pdfGenerator";

interface LineItem {
  id: number;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState("CLP");
  const [executive, setExecutive] = useState("Juan Pérez");
  const [requirement, setRequirement] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nextId, setNextId] = useState("COT-001");
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("Mi Empresa TI SpA");
  const [companyRut, setCompanyRut] = useState("76.000.000-0");
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, service: "", description: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    async function load() {
      const [clientesRes, cotizacionesRes, configRes] = await Promise.all([
        supabase.from("clientes").select("*").order("name"),
        supabase.from("cotizaciones").select("id").order("id", { ascending: false }).limit(1),
        supabase.from("configuracion").select("company_name, company_rut").eq("id", 1).maybeSingle(),
      ]);
      if (clientesRes.data) setClientes(clientesRes.data);
      if (configRes.data) {
        setCompanyName(configRes.data.company_name);
        setCompanyRut(configRes.data.company_rut);
      }
      if (cotizacionesRes.data && cotizacionesRes.data.length > 0) {
        const lastId = cotizacionesRes.data[0].id;
        const num = parseInt(lastId.replace("COT-", ""), 10);
        setNextId(`COT-${String(num + 1).padStart(3, "0")}`);
      }
    }
    load();
  }, []);

  const addItem = () => {
    setItems([...items, { id: Date.now(), service: "", description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: number, field: keyof LineItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    setSaving(true);

    const { error: cotError } = await supabase.from("cotizaciones").insert({
      id: nextId,
      client_id: clientId,
      executive,
      currency,
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
    }));

    const { error: itemsError } = await supabase.from("cotizacion_items").insert(itemsToInsert);
    if (itemsError) {
      toast.error("Error al guardar los items");
      setSaving(false);
      return;
    }

    const snapshot = items.map((i) => ({
      service: i.service,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));

    await supabase.from("cotizacion_versiones").insert({
      cotizacion_id: nextId,
      version: 1,
      status: "Vigente",
      items_snapshot: snapshot,
      total,
      currency,
      executive,
      requirement,
    });

    const selectedClient = clientes.find((c) => c.id === clientId) ?? null;
    toast.success(`Cotización ${nextId} creada exitosamente`, {
      action: {
        label: "Descargar PDF",
        onClick: () =>
          generateCotizacionPDF({
            quote: {
              id: nextId,
              executive,
              currency,
              status: "Borrador",
              requirement,
              version: 1,
              created_at: new Date().toISOString(),
              clientes: selectedClient
                ? { name: selectedClient.name, rut: selectedClient.rut, email: selectedClient.email, phone: selectedClient.phone }
                : null,
            },
            items: items.map((i) => ({
              id: String(i.id),
              cotizacion_id: nextId,
              service: i.service,
              description: i.description,
              quantity: i.quantity,
              unit_price: i.unitPrice,
              created_at: new Date().toISOString(),
            })),
            total,
            companyName,
            companyRut,
          }),
      },
    });
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
          <h2 className="font-semibold text-foreground">Cliente</h2>
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
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                  <SelectItem value="UF">UF (Unidad de Fomento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {currency === "UF" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent text-accent-foreground text-sm">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              El valor en UF se calculará según el valor vigente al momento de la facturación.
            </div>
          )}
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
              <div key={item.id} className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg bg-muted/30 border">
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Servicio/Producto</Label>}
                  <Input
                    placeholder="Servicio"
                    value={item.service}
                    onChange={(e) => updateItem(item.id, "service", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-4 space-y-1">
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
                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Valor Unit.</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-1 space-y-1 text-right">
                  {idx === 0 && <Label className="text-xs">Total</Label>}
                  <p className="text-sm font-medium py-2 text-foreground">
                    {(item.quantity * item.unitPrice).toLocaleString("es-CL")}
                  </p>
                </div>
                <div className="col-span-1 flex justify-center">
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

          <div className="flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">
                {currency === "UF" ? "UF " : "$"}
                {total.toLocaleString("es-CL")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-4 rounded-lg bg-accent text-accent-foreground text-sm border border-primary/10">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          La validez de esta cotización es de 5 días desde la fecha de emisión.
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/cotizaciones")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear Cotización"}
          </Button>
        </div>
      </form>
    </div>
  );
}

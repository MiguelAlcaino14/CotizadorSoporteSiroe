import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader as Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { supabase, type Cliente, type CotizacionItem } from "@/lib/supabase";

const IVA = 0.19;

interface LineItem {
  id: string;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: "CLP" | "UF";
  isNew?: boolean;
}

function itemTotalCLP(item: LineItem, ufValue: number): number {
  const base = item.quantity * item.unitPrice;
  return item.currency === "UF" ? base * ufValue : base;
}

export default function EditarCotizacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [executive, setExecutive] = useState("");
  const [requirement, setRequirement] = useState("");
  const [status, setStatus] = useState("");
  const [ufValue, setUfValue] = useState<number>(0);
  const [items, setItems] = useState<LineItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [cotRes, itemsRes, clientesRes] = await Promise.all([
        supabase.from("cotizaciones").select("*").eq("id", id).maybeSingle(),
        supabase.from("cotizacion_items").select("*").eq("cotizacion_id", id),
        supabase.from("clientes").select("*").order("name"),
      ]);
      if (cotRes.data) {
        setClientId(cotRes.data.client_id);
        setExecutive(cotRes.data.executive);
        setRequirement(cotRes.data.requirement ?? "");
        setStatus(cotRes.data.status);
      }
      if (itemsRes.data) {
        setItems(
          (itemsRes.data as CotizacionItem[]).map((i) => ({
            id: i.id,
            service: i.service,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            currency: (i.currency as "CLP" | "UF") ?? "CLP",
          }))
        );
      }
      if (clientesRes.data) setClientes(clientesRes.data);
      setLoading(false);
    }
    load();
  }, [id]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `new-${Date.now()}`,
        service: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        currency: "CLP",
        isNew: true,
      },
    ]);
  };

  const removeItem = (itemId: string) => {
    if (items.length === 1) return;
    const item = items.find((i) => i.id === itemId);
    if (item && !item.isNew) {
      setDeletedItemIds((prev) => [...prev, itemId]);
    }
    setItems(items.filter((i) => i.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)));
  };

  const hasUFItems = items.some((i) => i.currency === "UF");
  const netTotal = items.reduce((sum, i) => sum + itemTotalCLP(i, ufValue), 0);
  const ivaAmount = netTotal * IVA;
  const grandTotal = netTotal + ivaAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error("Selecciona un cliente"); return; }
    if (items.some((i) => !i.service.trim())) {
      toast.error("Completa el nombre del servicio en todos los ítems");
      return;
    }
    if (items.some((i) => i.unitPrice <= 0)) {
      toast.error("El valor unitario debe ser mayor a 0 en todos los ítems");
      return;
    }
    if (hasUFItems && ufValue <= 0) {
      toast.error("Ingresa el valor de la UF");
      return;
    }
    setSaving(true);

    const { error: cotError } = await supabase
      .from("cotizaciones")
      .update({
        client_id: clientId,
        executive,
        requirement,
        status,
        currency: hasUFItems ? "MIXTO" : "CLP",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (cotError) {
      toast.error("Error al actualizar la cotización");
      setSaving(false);
      return;
    }

    if (deletedItemIds.length > 0) {
      await supabase.from("cotizacion_items").delete().in("id", deletedItemIds);
    }

    const newItems = items.filter((i) => i.isNew);
    const existingItems = items.filter((i) => !i.isNew);

    if (newItems.length > 0) {
      await supabase.from("cotizacion_items").insert(
        newItems.map((i) => ({
          cotizacion_id: id,
          service: i.service,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          currency: i.currency,
        }))
      );
    }

    for (const item of existingItems) {
      await supabase
        .from("cotizacion_items")
        .update({
          service: item.service,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency: item.currency,
        })
        .eq("id", item.id);
    }

    toast.success(`Cotización ${id} actualizada`);
    navigate(`/cotizaciones/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/cotizaciones/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="page-header">Editar Cotización</h1>
          <p className="page-subheader">{id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Cliente</h2>
          <div className="space-y-1.5">
            <Label>Seleccionar cliente</Label>
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
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Borrador">Borrador</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Aprobada">Aprobada</SelectItem>
                  <SelectItem value="En ejecución">En ejecución</SelectItem>
                  <SelectItem value="Facturada">Facturada</SelectItem>
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
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Moneda</Label>}
                  <Select
                    value={item.currency}
                    onValueChange={(v) => {
                      updateItem(item.id, "currency", v);
                      updateItem(item.id, "unitPrice", 0);
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
                    step={item.currency === "UF" ? "0.01" : "1"}
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    placeholder={item.currency === "UF" ? "Ej: 5.5" : "0"}
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/cotizaciones/${id}`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</> : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}

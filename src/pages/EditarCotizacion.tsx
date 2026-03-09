import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader as Loader2 } from "lucide-react";
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
import { supabase, getAppConfigs, type Cliente, type CotizacionItem } from "@/lib/supabase";
import CotizacionItemsEditor, { type LineItem } from "@/components/CotizacionItemsEditor";

export default function EditarCotizacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [executive, setExecutive] = useState("");
  const [executives, setExecutives] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [requirement, setRequirement] = useState("");
  const [status, setStatus] = useState("");
  const [ufValue, setUfValue] = useState<number>(0);
  const [items, setItems] = useState<LineItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [cotRes, itemsRes, clientesRes, configs] = await Promise.all([
        supabase.from("cotizaciones").select("*").eq("id", id).maybeSingle(),
        supabase.from("cotizacion_items").select("*").eq("cotizacion_id", id),
        supabase.from("clientes").select("*").order("name"),
        getAppConfigs(["executives", "statuses"]),
      ]);
      setExecutives(configs["executives"] ?? []);
      setStatuses(configs["statuses"] ?? []);
      if (cotRes.data) {
        setClientId(cotRes.data.client_id);
        setExecutive(cotRes.data.executive);
        setRequirement(cotRes.data.requirement ?? "");
        setStatus(cotRes.data.status);
        if (cotRes.data.uf_value) setUfValue(cotRes.data.uf_value);
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

  const handleItemsChange = (newItems: LineItem[]) => {
    const removedIds = items
      .filter((old) => !old.isNew && !newItems.find((n) => n.id === old.id))
      .map((i) => String(i.id));
    if (removedIds.length > 0) {
      setDeletedItemIds((prev) => [...prev, ...removedIds]);
    }
    setItems(newItems);
  };

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
    const hasUF = items.some((i) => i.currency === "UF");
    if (hasUF && ufValue <= 0) {
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
        currency: hasUF ? "MIXTO" : "CLP",
        uf_value: hasUF ? ufValue : null,
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
    <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {executives.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
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
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6">
          <CotizacionItemsEditor
            items={items}
            ufValue={ufValue}
            onUfValueChange={setUfValue}
            onItemsChange={handleItemsChange}
            onSaveUfValue={async (v) => {
              const { error } = await supabase
                .from("cotizaciones")
                .update({ uf_value: v })
                .eq("id", id);
              if (error) {
                toast.error("Error al guardar el valor UF");
              } else {
                toast.success(`Valor UF $${v.toLocaleString("es-CL")} guardado`);
              }
            }}
          />
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

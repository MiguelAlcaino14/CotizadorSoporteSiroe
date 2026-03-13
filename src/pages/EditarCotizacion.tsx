import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileDown, Loader as Loader2 } from "lucide-react";
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
import { supabase, getAppConfigs, type Cliente, type CotizacionItem } from "@/lib/supabase";
import CotizacionItemsEditor, { type LineItem } from "@/components/CotizacionItemsEditor";
import { generateCotizacionPDF } from "@/lib/generateCotizacionPDF";

export default function EditarCotizacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [version, setVersion] = useState(1);
  const [validityDays, setValidityDays] = useState(30);

  const [clientId, setClientId] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [executive, setExecutive] = useState("");
  const [executives, setExecutives] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [requirement, setRequirement] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [status, setStatus] = useState("");
  const [ufValue, setUfValue] = useState<number>(0);
  const [terms, setTerms] = useState("");
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
        setRequesterName(cotRes.data.requester_name ?? "");
        setStatus(cotRes.data.status);
        setVersion(cotRes.data.version ?? 1);
        setValidityDays(cotRes.data.validity_days ?? 30);
        if (cotRes.data.uf_value) setUfValue(cotRes.data.uf_value);
        setTerms(cotRes.data.terms ?? "");
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
            category: i.category || "Servicio",
            rentalPeriod: i.rental_period || "",
            rentalFrom: i.rental_from ? new Date(i.rental_from + "T12:00:00") : null,
            rentalTo: i.rental_to ? new Date(i.rental_to + "T12:00:00") : null,
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

  const handleGenerarPDF = async () => {
    const selectedCliente = clientes.find((c) => c.id === clientId);
    if (!selectedCliente) { toast.error("Selecciona un cliente antes de generar el PDF"); return; }
    const hasUF = items.some((i) => i.currency === "UF");
    if (hasUF && ufValue <= 0) { toast.error("Ingresa el valor de la UF para generar el PDF"); return; }
    setGeneratingPDF(true);
    try {
      const netTotal = items.reduce((sum, i) => {
        const base = i.quantity * i.unitPrice;
        return sum + (i.currency === "UF" ? base * ufValue : base);
      }, 0);
      const ivaAmount = netTotal * 0.19;
      await generateCotizacionPDF({
        cotizacionId: id!,
        cliente: selectedCliente,
        executive,
        requirement,
        items,
        ufValue,
        netTotal,
        ivaAmount,
        grandTotal: netTotal + ivaAmount,
        version,
        validityDays,
        terms,
        requesterName,
      });
      toast.success(`PDF ${id} v${version} descargado`);
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setGeneratingPDF(false);
    }
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
        requester_name: requesterName.trim() || null,
        status,
        currency: hasUF ? "MIXTO" : "CLP",
        uf_value: hasUF ? ufValue : null,
        terms: terms.trim() || null,
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
          category: i.category || "Servicio",
          rental_period: i.rentalPeriod || null,
          rental_from: i.rentalFrom ? i.rentalFrom.toISOString().split("T")[0] : null,
          rental_to: i.rentalTo ? i.rentalTo.toISOString().split("T")[0] : null,
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
          category: item.category || "Servicio",
          rental_period: item.rentalPeriod || null,
          rental_from: item.rentalFrom ? item.rentalFrom.toISOString().split("T")[0] : null,
          rental_to: item.rentalTo ? item.rentalTo.toISOString().split("T")[0] : null,
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
          <div className="space-y-1.5">
            <Label>Nombre y apellido de quien solicita</Label>
            <Input
              placeholder="Ej: Juan Pérez"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
            />
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

        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-2">
          <Label htmlFor="terms">Términos y Condiciones <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <Textarea
            id="terms"
            placeholder="Ej: El precio no incluye instalación. Tiempo de entrega: 10 días hábiles..."
            rows={4}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="resize-y"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/cotizaciones/${id}`)}>
            Cancelar
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handleGenerarPDF} disabled={generatingPDF}>
            {generatingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {generatingPDF ? "Generando..." : "Generar PDF"}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</> : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}

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
import { getAppConfigs, type Cliente } from "@/lib/supabase";

type ApiCliente = {
  id: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
};
import { api } from "@/lib/api";
import CotizacionItemsEditor, { type LineItem } from "@/components/CotizacionItemsEditor";
import { generateCotizacionPDF } from "@/lib/generateCotizacionPDF";

type ApiCotizacion = {
  id: string;
  clientId: string;
  title: string;
  techDescription: string | null;
  executive: string;
  currency: string;
  status: string;
  requirement: string;
  requesterName: string | null;
  version: number;
  ufValue: number | null;
  validityDays: number;
  createdAt: string;
  updatedAt: string;
  terms: string | null;
};

type ApiItem = {
  id: string;
  cotizacionId: string;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  category: string;
  rentalPeriod: string | null;
  rentalFrom: string | null;
  rentalTo: string | null;
  createdAt: string;
};

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
  const [title, setTitle] = useState("");
  const [executive, setExecutive] = useState("");
  const [executives, setExecutives] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [requirement, setRequirement] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [status, setStatus] = useState("");
  const [ufValue, setUfValue] = useState<number>(0);
  const [terms, setTerms] = useState("");
  const [techDescription, setTechDescription] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [cotData, clientesData, configs] = await Promise.all([
          api.get<ApiCotizacion & { items: ApiItem[] }>(`/cotizaciones/${id}`),
          api.get<ApiCliente[]>("/clientes"),
          getAppConfigs(["executives", "statuses"]),
        ]);
        setExecutives(configs["executives"] ?? []);
        setStatuses(configs["statuses"] ?? []);
        if (cotData) {
          setClientId(cotData.clientId);
          setTitle(cotData.title ?? "");
          setExecutive(cotData.executive);
          setRequirement(cotData.requirement ?? "");
          setRequesterName(cotData.requesterName ?? "");
          setStatus(cotData.status);
          setVersion(cotData.version ?? 1);
          setValidityDays(cotData.validityDays ?? 30);
          if (cotData.ufValue) setUfValue(cotData.ufValue);
          setTerms(cotData.terms ?? "");
          setTechDescription(cotData.techDescription ?? "");
          if (cotData.items) {
            setItems(
              cotData.items.map((i) => ({
                id: i.id,
                service: i.service,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                currency: (i.currency as "CLP" | "UF") ?? "CLP",
                category: i.category || "Servicio",
                rentalPeriod: i.rentalPeriod || "",
                rentalFrom: i.rentalFrom ? new Date(i.rentalFrom + "T12:00:00") : null,
                rentalTo: i.rentalTo ? new Date(i.rentalTo + "T12:00:00") : null,
              }))
            );
          }
        }
        if (clientesData) {
          setClientes(
            clientesData.map((c) => ({
              id: c.id,
              name: c.name,
              rut: c.rut,
              email: c.email,
              phone: c.phone,
              address: c.address,
              created_at: c.createdAt,
            }))
          );
        }
      } catch {
        toast.error("Error al cargar los datos");
      }
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
    if (!title.trim()) { toast.error("El título de la cotización es requerido"); return; }
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

    try {
      const allItems = items.map((i) => ({
        service: i.service,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        currency: i.currency,
        category: i.category || "Servicio",
        rental_period: i.rentalPeriod || null,
        rental_from: i.rentalFrom ? i.rentalFrom.toISOString().split("T")[0] : null,
        rental_to: i.rentalTo ? i.rentalTo.toISOString().split("T")[0] : null,
      }));

      await api.put(`/cotizaciones/${id}`, {
        client_id: clientId,
        title: title.trim(),
        tech_description: techDescription.trim() || null,
        executive,
        requirement,
        requester_name: requesterName.trim() || null,
        status,
        currency: hasUF ? "MIXTO" : "CLP",
        uf_value: hasUF ? ufValue : null,
        terms: terms.trim() || null,
        items: allItems,
      });

      toast.success(`Cotización ${id} actualizada`);
      navigate(`/cotizaciones/${id}`);
    } catch {
      toast.error("Error al actualizar la cotización");
      setSaving(false);
    }
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
          <div className="space-y-1.5">
            <Label>Título <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Ej: Servicio de soporte técnico mensual"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
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
              try {
                await api.put(`/cotizaciones/${id}`, { uf_value: v });
                toast.success(`Valor UF $${v.toLocaleString("es-CL")} guardado`);
              } catch {
                toast.error("Error al guardar el valor UF");
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

        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-2">
          <Label htmlFor="techDescription">Descripción para el técnico <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <Textarea
            id="techDescription"
            placeholder="Ej: El cliente requiere instalación en horario nocturno. Coordinar con Carlos..."
            rows={4}
            value={techDescription}
            onChange={(e) => setTechDescription(e.target.value)}
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

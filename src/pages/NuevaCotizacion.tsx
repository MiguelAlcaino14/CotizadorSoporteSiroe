import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Info, UserPlus, FileDown, Loader as Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { type Cliente } from "@/lib/supabase";
import { api } from "@/lib/api";
import { generateCotizacionPDF } from "@/lib/generateCotizacionPDF";
import CotizacionItemsEditor, { type LineItem } from "@/components/CotizacionItemsEditor";

type ApiCliente = {
  id: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
};

const IVA = 0.19;

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
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [executive, setExecutive] = useState("");
  const [requirement, setRequirement] = useState("");
  const [clientId, setClientId] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nextId, setNextId] = useState("COT-001");
  const [customId, setCustomId] = useState("");
  const [validityDays, setValidityDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showTechDescModal, setShowTechDescModal] = useState(false);
  const [techDescription, setTechDescription] = useState("");
  const [savingTechDesc, setSavingTechDesc] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
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
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, service: "", description: "", quantity: 1, unitPrice: 0, currency: "CLP", category: "Servicio", rentalPeriod: "" },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (profile?.full_name) setExecutive(profile.full_name);
  }, [profile]);

  async function loadData() {
    try {
      const [clientesData, cotizacionesData] = await Promise.all([
        api.get<ApiCliente[]>("/clientes"),
        api.get<{ id: string }[]>("/cotizaciones"),
      ]);
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
      if (cotizacionesData && cotizacionesData.length > 0) {
        // Find the highest COT-XXX id
        const sortedIds = cotizacionesData
          .map((c) => c.id)
          .filter((id) => /^COT-\d+$/.test(id))
          .sort((a, b) => {
            const na = parseInt(a.replace("COT-", ""), 10);
            const nb = parseInt(b.replace("COT-", ""), 10);
            return nb - na;
          });
        if (sortedIds.length > 0) {
          const lastId = sortedIds[0];
          const num = parseInt(lastId.replace("COT-", ""), 10);
          const generated = `COT-${String(num + 1).padStart(3, "0")}`;
          setNextId(generated);
          setCustomId(generated);
        } else {
          setCustomId("COT-001");
        }
      } else {
        setCustomId("COT-001");
      }
    } catch {
      toast.error("Error al cargar los datos");
    }
  }

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
    try {
      const data = await api.post<ApiCliente>("/clientes", nuevoCliente);
      if (data) {
        const mapped: Cliente = {
          id: data.id,
          name: data.name,
          rut: data.rut,
          email: data.email,
          phone: data.phone,
          address: data.address,
          created_at: data.createdAt,
        };
        setClientes((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
        setClientId(data.id);
        toast.success(`Cliente ${data.name} creado`);
      }
      setShowNuevoClienteModal(false);
      setNuevoCliente({ name: "", rut: "", email: "", phone: "", address: "" });
    } catch {
      toast.error("Error al crear el cliente");
    }
    setSavingCliente(false);
  };

  const handleGenerarPDF = async () => {
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
      await generateCotizacionPDF({
        cotizacionId: customId.trim() || nextId,
        cliente: selectedCliente,
        executive,
        requirement,
        items,
        ufValue,
        netTotal,
        ivaAmount,
        grandTotal,
        terms,
        requesterName,
      });
      toast.success(`PDF ${customId.trim() || nextId}.pdf descargado`);
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El título de la cotización es requerido");
      return;
    }
    if (!clientId) {
      toast.error("Selecciona un cliente");
      return;
    }
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
    const finalId = customId.trim() || nextId;
    setSaving(true);

    try {
      const itemsToInsert = items.map((i) => ({
        cotizacion_id: finalId,
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

      await api.post("/cotizaciones", {
        id: finalId,
        client_id: clientId,
        title: title.trim(),
        executive,
        currency: hasUFItems ? "MIXTO" : "CLP",
        status: "Borrador",
        requirement,
        requester_name: requesterName.trim() || null,
        version: 1,
        uf_value: hasUFItems ? ufValue : null,
        validity_days: validityDays,
        terms: terms.trim() || null,
        items: itemsToInsert,
      });

      toast.success(`Cotización ${finalId} creada exitosamente`);
      setCreatedId(finalId);
      setShowTechDescModal(true);
      setSaving(false);
    } catch {
      toast.error("Error al crear la cotización");
      setSaving(false);
    }
  };

  const handleSaveTechDesc = async () => {
    if (!createdId) return;
    setSavingTechDesc(true);
    try {
      await api.patch(`/cotizaciones/${createdId}/tech-description`, {
        tech_description: techDescription.trim() || null,
      });
    } catch {
      // No bloquea el flujo si falla
    }
    setSavingTechDesc(false);
    navigate("/cotizaciones");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="page-header">Nueva Cotización</h1>
          <p className="page-subheader">{customId.trim() || nextId} • Borrador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
              <Label>ID de Cotización</Label>
              <Input
                placeholder={nextId}
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
              />
            </div>
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
              <Input value={executive} readOnly className="bg-muted/40 cursor-default" />
            </div>
            <div className="space-y-1.5">
              <Label>Validez (días)</Label>
              <Input
                type="number"
                min={1}
                placeholder="30"
                value={validityDays}
                onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6">
          <CotizacionItemsEditor
            items={items}
            ufValue={ufValue}
            onUfValueChange={setUfValue}
            onItemsChange={setItems}
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

        <div className="flex items-start gap-2 p-4 rounded-lg bg-accent text-accent-foreground text-sm border border-primary/10">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          La validez de esta cotización es de {validityDays} día{validityDays !== 1 ? "s" : ""} desde la fecha de emisión. Los precios incluyen IVA (19%).
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

      {/* Dialog: descripción para el técnico */}
      <Dialog open={showTechDescModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Descripción para el técnico</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Puedes agregar notas internas para el equipo técnico. Este campo es opcional.
            </p>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Ej: El cliente requiere instalación en horario nocturno. Coordinar con Carlos..."
              rows={5}
              value={techDescription}
              onChange={(e) => setTechDescription(e.target.value)}
              className="resize-y"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/cotizaciones")}
              disabled={savingTechDesc}
            >
              Omitir
            </Button>
            <Button onClick={handleSaveTechDesc} disabled={savingTechDesc}>
              {savingTechDesc ? "Guardando..." : "Guardar y continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

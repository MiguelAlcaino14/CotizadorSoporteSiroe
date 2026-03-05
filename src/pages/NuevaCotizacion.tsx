import { useState } from "react";
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
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, service: "", description: "", quantity: 1, unitPrice: 0 },
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Cotización creada exitosamente");
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
          <p className="page-subheader">COT-106 • Borrador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Info */}
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Información del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre del cliente</Label>
              <Input placeholder="Nombre completo" required />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input placeholder="Razón social" required />
            </div>
            <div className="space-y-1.5">
              <Label>RUT</Label>
              <Input placeholder="XX.XXX.XXX-X" required />
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input type="email" placeholder="correo@empresa.cl" required />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="+56 9 XXXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input placeholder="Dirección (opcional)" />
            </div>
          </div>
        </div>

        {/* Quote Info */}
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Información de la Cotización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>N° Requerimiento (opcional)</Label>
              <Input placeholder="REQ-XXX" />
            </div>
            <div className="space-y-1.5">
              <Label>Ejecutivo responsable</Label>
              <Select defaultValue="juan">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juan">Juan Pérez</SelectItem>
                  <SelectItem value="maria">María García</SelectItem>
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

        {/* Line Items */}
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

        {/* Validity note */}
        <div className="flex items-start gap-2 p-4 rounded-lg bg-accent text-accent-foreground text-sm border border-primary/10">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          La validez de esta cotización es de 5 días desde la fecha de emisión.
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/cotizaciones")}>
            Cancelar
          </Button>
          <Button type="submit">Crear Cotización</Button>
        </div>
      </form>
    </div>
  );
}

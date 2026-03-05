import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Clock, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const quoteData = {
  id: "COT-105",
  client: "Empresa ABC",
  company: "Empresa ABC SpA",
  rut: "76.123.456-7",
  email: "contacto@empresaabc.cl",
  phone: "+56 9 1234 5678",
  executive: "Juan Pérez",
  date: "04/03/2026",
  currency: "CLP",
  status: "Aprobada",
  requirement: "REQ-042",
  versions: [
    { version: 1, date: "01/03/2026", status: "Reemplazada" },
    { version: 2, date: "04/03/2026", status: "Vigente" },
  ],
  items: [
    { service: "Instalación de red", description: "Cableado estructurado Cat6", quantity: 1, unitPrice: 1500000, total: 1500000 },
    { service: "Configuración firewall", description: "FortiGate 60F", quantity: 1, unitPrice: 650000, total: 650000 },
    { service: "Soporte técnico", description: "Soporte remoto 3 meses", quantity: 3, unitPrice: 100000, total: 300000 },
  ],
};

export default function DetalleCotizacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showOCModal, setShowOCModal] = useState(false);
  const [hasOC, setHasOC] = useState<boolean | null>(null);

  const total = quoteData.items.reduce((s, i) => s + i.total, 0);

  const handleApprovalUpload = () => {
    toast.success("Documento de aprobación adjuntado");
    setShowOCModal(true);
  };

  const handleOCResponse = (value: boolean) => {
    setHasOC(value);
    setShowOCModal(false);
    if (value) {
      toast.info("Por favor suba la Orden de Compra");
    } else {
      toast.success("Se notificará a facturación para generar la factura");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="page-header">{quoteData.id}</h1>
            <p className="page-subheader">{quoteData.client} • {quoteData.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Copy className="h-4 w-4" /> Nueva Versión
          </Button>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            {quoteData.status}
          </Badge>
        </div>
      </div>

      {/* Client & Quote Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Información del Cliente</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span className="text-foreground">{quoteData.company}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RUT</span><span className="text-foreground">{quoteData.rut}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{quoteData.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span className="text-foreground">{quoteData.phone}</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Detalles de Cotización</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">N° Requerimiento</span><span className="text-foreground">{quoteData.requirement}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ejecutivo</span><span className="text-foreground">{quoteData.executive}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Moneda</span><span className="text-foreground">{quoteData.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="text-foreground">{quoteData.date}</span></div>
          </div>
        </div>
      </div>

      {/* Versions */}
      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-foreground">Versiones</h2>
        <div className="flex gap-3">
          {quoteData.versions.map((v) => (
            <div
              key={v.version}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                v.status === "Vigente" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {v.status === "Vigente" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              Versión {v.version} • {v.date}
            </div>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-foreground">Servicios / Productos</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Servicio</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Descripción</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Cant.</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Valor Unit.</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quoteData.items.map((item, i) => (
              <tr key={i}>
                <td className="px-5 py-3 text-sm font-medium text-foreground">{item.service}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{item.description}</td>
                <td className="px-5 py-3 text-sm text-right text-foreground">{item.quantity}</td>
                <td className="px-5 py-3 text-sm text-right text-foreground">${item.unitPrice.toLocaleString("es-CL")}</td>
                <td className="px-5 py-3 text-sm text-right font-medium text-foreground">${item.total.toLocaleString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-right text-foreground">Total</td>
              <td className="px-5 py-3 text-lg font-bold text-right text-primary">${total.toLocaleString("es-CL")}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Documentos y Acciones</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={handleApprovalUpload}>
            <Upload className="h-4 w-4" /> Adjuntar Aprobación
          </Button>
          {hasOC === true && (
            <Button variant="outline" className="gap-2" onClick={() => toast.success("OC subida correctamente")}>
              <Upload className="h-4 w-4" /> Subir Orden de Compra
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => toast.success("Factura subida correctamente")}>
            <FileText className="h-4 w-4" /> Subir Factura
          </Button>
        </div>
      </div>

      {/* OC Modal */}
      <Dialog open={showOCModal} onOpenChange={setShowOCModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Esta cotización tiene Orden de Compra (OC)?</DialogTitle>
            <DialogDescription>
              Indique si el cliente ha proporcionado una Orden de Compra para esta cotización.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleOCResponse(false)}>No</Button>
            <Button onClick={() => handleOCResponse(true)}>Sí</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

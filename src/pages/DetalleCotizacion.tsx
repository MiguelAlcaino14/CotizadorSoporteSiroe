import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Copy, Download, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase, type Cotizacion, type CotizacionItem, type CotizacionVersion, type Documento } from "@/lib/supabase";
import { generateCotizacionPDF } from "@/lib/pdfGenerator";

const statusColors: Record<string, string> = {
  Aprobada: "bg-success/10 text-success border-success/20",
  "En ejecución": "bg-info/10 text-info border-info/20",
  Pendiente: "bg-warning/10 text-warning border-warning/20",
  Facturada: "bg-muted text-muted-foreground border-border",
  Borrador: "bg-secondary text-secondary-foreground border-border",
};

type CotizacionFull = Cotizacion & {
  clientes: {
    name: string;
    rut: string;
    email: string;
    phone: string;
  } | null;
};

export default function DetalleCotizacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showOCModal, setShowOCModal] = useState(false);
  const [hasOC, setHasOC] = useState<boolean | null>(null);
  const [quote, setQuote] = useState<CotizacionFull | null>(null);
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [versions, setVersions] = useState<CotizacionVersion[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [companyName, setCompanyName] = useState("Mi Empresa TI SpA");
  const [companyRut, setCompanyRut] = useState("76.000.000-0");

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      const [quoteRes, itemsRes, versionsRes, docsRes, configRes] = await Promise.all([
        supabase.from("cotizaciones").select("*, clientes(name, rut, email, phone)").eq("id", id).maybeSingle(),
        supabase.from("cotizacion_items").select("*").eq("cotizacion_id", id),
        supabase.from("cotizacion_versiones").select("*").eq("cotizacion_id", id).order("version", { ascending: false }),
        supabase.from("documentos").select("*").eq("cotizacion_id", id).order("created_at"),
        supabase.from("configuracion").select("company_name, company_rut").eq("id", 1).maybeSingle(),
      ]);
      if (quoteRes.data) setQuote(quoteRes.data as CotizacionFull);
      if (itemsRes.data) setItems(itemsRes.data);
      if (versionsRes.data) setVersions(versionsRes.data);
      if (docsRes.data) setDocumentos(docsRes.data);
      if (configRes.data) {
        setCompanyName(configRes.data.company_name);
        setCompanyRut(configRes.data.company_rut);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const toggleVersion = (versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) next.delete(versionId);
      else next.add(versionId);
      return next;
    });
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
    generateCotizacionPDF({
      quote,
      items,
      total,
      companyName,
      companyRut,
    });
  };

  const handleApprovalUpload = async () => {
    if (!id) return;
    const { error } = await supabase.from("documentos").insert({
      cotizacion_id: id,
      name: `Aprobación ${id}.pdf`,
      type: "Aprobación",
    });
    if (error) {
      toast.error("Error al adjuntar aprobación");
      return;
    }
    const { data } = await supabase.from("documentos").select("*").eq("cotizacion_id", id).order("created_at");
    if (data) setDocumentos(data);
    toast.success("Documento de aprobación adjuntado");
    setShowOCModal(true);
  };

  const handleOCResponse = async (value: boolean) => {
    setHasOC(value);
    setShowOCModal(false);
    if (value) {
      toast.info("Por favor suba la Orden de Compra");
    } else {
      toast.success("Se notificará a facturación para generar la factura");
    }
  };

  const handleUploadOC = async () => {
    if (!id) return;
    const { error } = await supabase.from("documentos").insert({
      cotizacion_id: id,
      name: `OC_${id}_${new Date().getFullYear()}.pdf`,
      type: "Orden de Compra",
    });
    if (error) { toast.error("Error al subir OC"); return; }
    const { data } = await supabase.from("documentos").select("*").eq("cotizacion_id", id).order("created_at");
    if (data) setDocumentos(data);
    toast.success("OC subida correctamente");
  };

  const handleUploadFactura = async () => {
    if (!id) return;
    const { error } = await supabase.from("documentos").insert({
      cotizacion_id: id,
      name: `Factura_${id}.pdf`,
      type: "Factura",
    });
    if (error) { toast.error("Error al subir factura"); return; }
    const { data } = await supabase.from("documentos").select("*").eq("cotizacion_id", id).order("created_at");
    if (data) setDocumentos(data);
    toast.success("Factura subida correctamente");
  };

  const handleNuevaVersion = async () => {
    if (!quote || !id) return;
    const newVersion = quote.version + 1;

    await supabase
      .from("cotizacion_versiones")
      .update({ status: "Reemplazada" })
      .eq("cotizacion_id", id)
      .eq("status", "Vigente");

    const snapshot = items.map((i) => ({
      service: i.service,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));

    await supabase.from("cotizacion_versiones").insert({
      cotizacion_id: id,
      version: newVersion,
      status: "Vigente",
      items_snapshot: snapshot,
      total,
      currency: quote.currency,
      executive: quote.executive,
      requirement: quote.requirement,
    });

    await supabase.from("cotizaciones").update({ version: newVersion }).eq("id", id);

    const [updatedQuote, updatedVersions] = await Promise.all([
      supabase.from("cotizaciones").select("*, clientes(name, rut, email, phone)").eq("id", id).maybeSingle(),
      supabase.from("cotizacion_versiones").select("*").eq("cotizacion_id", id).order("version", { ascending: false }),
    ]);
    if (updatedQuote.data) setQuote(updatedQuote.data as CotizacionFull);
    if (updatedVersions.data) setVersions(updatedVersions.data);

    toast.success(`Nueva versión v${newVersion} creada`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-muted-foreground">Cotización no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="page-header">{quote.id}</h1>
            <p className="page-subheader">
              {quote.clientes?.name ?? "-"} • {new Date(quote.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" /> Descargar PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleNuevaVersion}>
            <Copy className="h-4 w-4" /> Nueva Versión
          </Button>
          <Badge variant="outline" className={statusColors[quote.status]}>
            {quote.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Información del Cliente</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span className="text-foreground">{quote.clientes?.name ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RUT</span><span className="text-foreground">{quote.clientes?.rut ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{quote.clientes?.email ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span className="text-foreground">{quote.clientes?.phone || "-"}</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Detalles de Cotización</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">N° Requerimiento</span><span className="text-foreground">{quote.requirement || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ejecutivo</span><span className="text-foreground">{quote.executive}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Moneda</span><span className="text-foreground">{quote.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="text-foreground">{new Date(quote.created_at).toLocaleDateString("es-CL")}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-foreground">Servicios / Productos (Versión Actual)</h2>
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
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-sm font-medium text-foreground">{item.service}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{item.description}</td>
                <td className="px-5 py-3 text-sm text-right text-foreground">{item.quantity}</td>
                <td className="px-5 py-3 text-sm text-right text-foreground">${item.unit_price.toLocaleString("es-CL")}</td>
                <td className="px-5 py-3 text-sm text-right font-medium text-foreground">${(item.quantity * item.unit_price).toLocaleString("es-CL")}</td>
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

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-foreground">Historial de Versiones</h2>
        </div>
        <div className="divide-y">
          {versions.map((v) => {
            const isExpanded = expandedVersions.has(v.id);
            const hasSnapshot = v.items_snapshot && v.items_snapshot.length > 0;
            const vTotal = v.total || (hasSnapshot ? v.items_snapshot.reduce((s, i) => s + i.quantity * i.unit_price, 0) : 0);
            const curr = v.currency || quote.currency;

            return (
              <div key={v.id}>
                <button
                  onClick={() => toggleVersion(v.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <span className="font-medium text-sm">v{v.version}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        v.status === "Vigente"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {v.status}
                    </Badge>
                    {v.executive && (
                      <span className="text-xs text-muted-foreground">{v.executive}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    {vTotal > 0 && (
                      <span className="text-sm font-semibold text-foreground">
                        {curr === "UF" ? "UF " : "$"}{vTotal.toLocaleString("es-CL")}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-muted/10 border-t px-5 pb-4 pt-3 space-y-3">
                    {(v.requirement || v.executive) && (
                      <div className="flex gap-6 text-xs text-muted-foreground pb-2">
                        {v.executive && <span>Ejecutivo: <span className="text-foreground font-medium">{v.executive}</span></span>}
                        {v.requirement && <span>Requerimiento: <span className="text-foreground font-medium">{v.requirement}</span></span>}
                        {v.currency && <span>Moneda: <span className="text-foreground font-medium">{v.currency}</span></span>}
                      </div>
                    )}
                    {hasSnapshot ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Servicio</TableHead>
                            <TableHead className="text-xs">Descripción</TableHead>
                            <TableHead className="text-xs text-right">Cant.</TableHead>
                            <TableHead className="text-xs text-right">Val. Unit.</TableHead>
                            <TableHead className="text-xs text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {v.items_snapshot.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm py-2">{item.service}</TableCell>
                              <TableCell className="text-sm py-2 text-muted-foreground">{item.description}</TableCell>
                              <TableCell className="text-sm py-2 text-right">{item.quantity}</TableCell>
                              <TableCell className="text-sm py-2 text-right">${item.unit_price.toLocaleString("es-CL")}</TableCell>
                              <TableCell className="text-sm py-2 text-right font-medium">${(item.quantity * item.unit_price).toLocaleString("es-CL")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sin detalle de items para esta versión.</p>
                    )}
                    {vTotal > 0 && (
                      <div className="flex justify-end pt-1 border-t">
                        <span className="text-sm font-bold text-primary">
                          Total: {curr === "UF" ? "UF " : "$"}{vTotal.toLocaleString("es-CL")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Documentos y Acciones</h2>
        {documentos.length > 0 && (
          <div className="space-y-2 mb-2">
            {documentos.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{d.name}</span>
                <Badge variant="outline" className="text-xs">{d.type}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("es-CL")}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={handleApprovalUpload}>
            <Upload className="h-4 w-4" /> Adjuntar Aprobación
          </Button>
          {hasOC === true && (
            <Button variant="outline" className="gap-2" onClick={handleUploadOC}>
              <Upload className="h-4 w-4" /> Subir Orden de Compra
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={handleUploadFactura}>
            <FileText className="h-4 w-4" /> Subir Factura
          </Button>
        </div>
      </div>

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

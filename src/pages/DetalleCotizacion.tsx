import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Copy, Pencil, Trash2, X, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { type Cotizacion, type CotizacionItem, type CotizacionVersion, type Documento } from "@/lib/supabase";
import { api } from "@/lib/api";

const statusColors: Record<string, string> = {
  Aprobada: "bg-success/10 text-success border-success/20",
  "En ejecución": "bg-info/10 text-info border-info/20",
  Pendiente: "bg-warning/10 text-warning border-warning/20",
  Facturada: "bg-muted text-muted-foreground border-border",
  Borrador: "bg-secondary text-secondary-foreground border-border",
  Rechazada: "bg-destructive/10 text-destructive border-destructive/20",
};

type CotizacionFull = Cotizacion & {
  clientes: { name: string; rut: string; email: string; phone: string } | null;
};

type ApiCotizacionFull = {
  id: string;
  clientId: string;
  title: string;
  executive: string;
  currency: string;
  status: string;
  requirement: string;
  requesterName: string | null;
  techDescription: string | null;
  version: number;
  ufValue: number | null;
  validityDays: number;
  createdAt: string;
  updatedAt: string;
  terms: string | null;
  clientes: { name: string; rut: string; email: string; phone: string } | null;
  items: ApiItem[];
  versiones: ApiVersion[];
  documentos: ApiDocumento[];
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

type ApiVersion = {
  id: string;
  cotizacionId: string;
  version: number;
  status: string;
  createdAt: string;
  itemsSnapshot: ApiItem[] | null;
  total: number | null;
  currency: string | null;
  executive: string | null;
  requirement: string | null;
  requesterName: string | null;
  ufValue: number | null;
};

type ApiDocumento = {
  id: string;
  cotizacionId: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
};

export default function DetalleCotizacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [showOCModal, setShowOCModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasOC, setHasOC] = useState<boolean | null>(null);
  const [quote, setQuote] = useState<CotizacionFull | null>(null);
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [versions, setVersions] = useState<CotizacionVersion[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const approvalInputRef = useRef<HTMLInputElement>(null);
  const facturaInputRef = useRef<HTMLInputElement>(null);
  const ocInputRef = useRef<HTMLInputElement>(null);

  const toggleVersion = (versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      next.has(versionId) ? next.delete(versionId) : next.add(versionId);
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        const data = await api.get<ApiCotizacionFull>(`/cotizaciones/${id}`);
        if (data) {
          const mappedQuote: CotizacionFull = {
            id: data.id,
            client_id: data.clientId,
            title: data.title ?? "",
            executive: data.executive,
            currency: data.currency,
            status: data.status,
            requirement: data.requirement,
            requester_name: data.requesterName,
            tech_description: data.techDescription ?? null,
            version: data.version,
            uf_value: data.ufValue,
            validity_days: data.validityDays,
            created_at: data.createdAt,
            updated_at: data.updatedAt,
            clientes: data.clientes,
          };
          setQuote(mappedQuote);

          const mappedItems: CotizacionItem[] = (data.items ?? []).map((i) => ({
            id: i.id,
            cotizacion_id: i.cotizacionId,
            service: i.service,
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            currency: i.currency,
            category: i.category,
            rental_period: i.rentalPeriod,
            rental_from: i.rentalFrom,
            rental_to: i.rentalTo,
            created_at: i.createdAt,
          }));
          setItems(mappedItems);

          const mappedVersions: CotizacionVersion[] = (data.versiones ?? []).map((v) => ({
            id: v.id,
            cotizacion_id: v.cotizacionId,
            version: v.version,
            status: v.status,
            created_at: v.createdAt,
            items_snapshot: v.itemsSnapshot
              ? v.itemsSnapshot.map((i) => ({
                  id: i.id,
                  cotizacion_id: i.cotizacionId,
                  service: i.service,
                  description: i.description,
                  quantity: i.quantity,
                  unit_price: i.unitPrice,
                  currency: i.currency,
                  category: i.category,
                  rental_period: i.rentalPeriod,
                  rental_from: i.rentalFrom,
                  rental_to: i.rentalTo,
                  created_at: i.createdAt,
                }))
              : null,
            total: v.total,
            currency: v.currency,
            executive: v.executive,
            requirement: v.requirement,
            requester_name: v.requesterName,
            uf_value: v.ufValue,
          }));
          setVersions(mappedVersions);

          const mappedDocumentos: Documento[] = (data.documentos ?? []).map((d) => ({
            id: d.id,
            cotizacion_id: d.cotizacionId,
            name: d.name,
            type: d.type,
            url: d.url,
            created_at: d.createdAt,
          }));
          setDocumentos(mappedDocumentos);
        }
      } catch {
        toast.error("Error al cargar la cotización");
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const ufValue = quote?.uf_value ?? 0;
  const total = items.reduce((s, i) => {
    const lineTotal = i.quantity * i.unit_price;
    return s + (i.currency === "UF" ? lineTotal * ufValue : lineTotal);
  }, 0);

  const uploadFile = async (file: File, type: string, _prefix: string) => {
    if (!id) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cotizacion_id", id);
      formData.append("name", file.name);
      formData.append("type", type);
      const doc = await api.upload<ApiDocumento>("/documentos", formData);
      const newDoc: Documento = {
        id: doc.id,
        cotizacion_id: doc.cotizacionId,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        created_at: doc.createdAt,
      };
      setDocumentos((prev) => [...prev, newDoc]);
      setUploading(false);
      return doc.url;
    } catch (err: any) {
      toast.error(`Error al subir el archivo: ${err.message}`);
      setUploading(false);
      return null;
    }
  };

  const handleApprovalFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    const url = await uploadFile(file, "Aprobación", "Aprobacion");
    if (url) { toast.success("Aprobación adjuntada correctamente"); setShowOCModal(true); }
  };

  const handleFacturaFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    const url = await uploadFile(file, "Factura", "Factura");
    if (url) toast.success("Factura subida correctamente");
  };

  const handleOCFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    const url = await uploadFile(file, "Orden de Compra", "OC");
    if (url) toast.success("Orden de Compra subida correctamente");
  };

  const handleOCResponse = async (value: boolean) => {
    setHasOC(value); setShowOCModal(false);
    if (value) setTimeout(() => ocInputRef.current?.click(), 100);
  };

  const handleDeleteDocumento = async (docId: string) => {
    try {
      await api.delete(`/documentos/${docId}`);
      setDocumentos((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Documento eliminado");
    } catch {
      toast.error("Error al eliminar documento");
    }
  };

  const handleNuevaVersion = async () => {
    if (!quote || !id) return;
    try {
      const result = await api.post<{ message: string; cotizacion: { version: number } }>(`/cotizaciones/${id}/versiones`, {});
      // Reload full cotizacion to get updated versions and quote
      const data = await api.get<ApiCotizacionFull>(`/cotizaciones/${id}`);
      if (data) {
        setQuote({
          id: data.id,
          client_id: data.clientId,
          executive: data.executive,
          currency: data.currency,
          status: data.status,
          requirement: data.requirement,
          requester_name: data.requesterName,
          version: data.version,
          uf_value: data.ufValue,
          validity_days: data.validityDays,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          clientes: data.clientes,
        });
        const mappedVersions: CotizacionVersion[] = (data.versiones ?? []).map((v) => ({
          id: v.id,
          cotizacion_id: v.cotizacionId,
          version: v.version,
          status: v.status,
          created_at: v.createdAt,
          items_snapshot: v.itemsSnapshot
            ? v.itemsSnapshot.map((i) => ({
                id: i.id,
                cotizacion_id: i.cotizacionId,
                service: i.service,
                description: i.description,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                currency: i.currency,
                category: i.category,
                rental_period: i.rentalPeriod,
                rental_from: i.rentalFrom,
                rental_to: i.rentalTo,
                created_at: i.createdAt,
              }))
            : null,
          total: v.total,
          currency: v.currency,
          executive: v.executive,
          requirement: v.requirement,
          requester_name: v.requesterName,
          uf_value: v.ufValue,
        }));
        setVersions(mappedVersions);
      }
      toast.success(`Nueva versión v${result.cotizacion.version} creada`);
    } catch (err: any) {
      toast.error(err.message ?? "Error al crear nueva versión");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/cotizaciones/${id}`);
      toast.success(`Cotización ${id} eliminada`);
      navigate("/cotizaciones");
    } catch {
      toast.error("Error al eliminar la cotización");
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Cargando...</p></div>;

  if (!quote) return (
    <div className="space-y-4">
      <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}><ArrowLeft className="h-5 w-5" /></Button>
      <p className="text-muted-foreground">Cotización no encontrada.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cotizaciones")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="page-header">{quote.id}</h1>
            <p className="page-subheader">{quote.clientes?.name ?? "-"} • {new Date(quote.created_at).toLocaleDateString("es-CL")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleNuevaVersion}>
            <Copy className="h-4 w-4" /><span className="hidden sm:inline">Nueva Versión</span><span className="sm:hidden">Versión</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/cotizaciones/${id}/editar`)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          )}
          <Badge variant="outline" className={statusColors[quote.status]}>{quote.status}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="detalles">
        <TabsList>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
          <TabsTrigger value="versiones">Versiones</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* ── TAB: DETALLES ── */}
        <TabsContent value="detalles" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
              <h2 className="font-semibold text-foreground">Información del Cliente</h2>
              <div className="space-y-2 text-sm">
                {[
                  ["Razon social", quote.clientes?.name ?? "-"],
                  ["RUT", quote.clientes?.rut ?? "-"],
                  ["Email", quote.clientes?.email ?? "-"],
                  ["Teléfono", quote.clientes?.phone || "-"],
                  ["Solicitado por", quote.requester_name || "-"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
              <h2 className="font-semibold text-foreground">Detalles de Cotización</h2>
              <div className="space-y-2 text-sm">
                {[
                  ["N° Requerimiento", quote.requirement || "-"],
                  ["Ejecutivo", quote.executive],
                  ["Moneda", quote.currency],
                  ...(quote.uf_value != null ? [["Valor UF", `$${quote.uf_value.toLocaleString("es-CL")} CLP`]] : []),
                  ["Fecha", new Date(quote.created_at).toLocaleDateString("es-CL")],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Servicios / Productos */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-foreground">Servicios / Productos</h2>
              {ufValue > 0 && items.some((i) => i.currency === "UF") && (
                <span className="text-xs text-muted-foreground bg-warning/10 border border-warning/20 rounded px-2 py-1">
                  Valor UF: <span className="font-semibold text-foreground">${ufValue.toLocaleString("es-CL")} CLP</span>
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {["Servicio", "Descripción", "Cant.", "Moneda", "Valor Unit.", "Total"].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-medium text-muted-foreground uppercase ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => {
                    const lineUF = item.quantity * item.unit_price;
                    const lineCLP = item.currency === "UF" ? lineUF * ufValue : lineUF;
                    return (
                      <tr key={item.id}>
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{item.service}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{item.description}</td>
                        <td className="px-5 py-3 text-sm text-right text-foreground">{item.quantity}</td>
                        <td className="px-5 py-3 text-sm text-right text-foreground">{item.currency ?? "CLP"}</td>
                        <td className="px-5 py-3 text-sm text-right text-foreground">
                          {item.currency === "UF" ? `UF ${item.unit_price.toLocaleString("es-CL")}` : `$${item.unit_price.toLocaleString("es-CL")}`}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-medium text-foreground">
                          {item.currency === "UF" ? (
                            <span className="flex flex-col items-end gap-0.5">
                              <span>UF {lineUF.toLocaleString("es-CL")}</span>
                              {ufValue > 0 ? <span className="text-xs text-muted-foreground">${Math.round(lineCLP).toLocaleString("es-CL")} CLP</span> : <span className="text-xs text-warning">Sin valor UF</span>}
                            </span>
                          ) : `$${Math.round(lineCLP).toLocaleString("es-CL")}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/20">
                    <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-right text-foreground">Total</td>
                    <td className="px-5 py-3 text-lg font-bold text-right text-primary">${total.toLocaleString("es-CL")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Descripción para el técnico */}
          {quote.tech_description && (
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Descripción para el técnico</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(quote.tech_description!);
                    toast.success("Descripción copiada al portapapeles");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.tech_description}</p>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: VERSIONES ── */}
        <TabsContent value="versiones" className="mt-4">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-foreground">Historial de Versiones</h2>
            </div>
            <div className="divide-y">
              {versions.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center text-muted-foreground">Sin versiones registradas.</p>
              ) : versions.map((v) => {
                const isExpanded = expandedVersions.has(v.id);
                return (
                  <div key={v.id}>
                    <button
                      className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                      onClick={() => toggleVersion(v.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-semibold text-foreground">v{v.version}</span>
                        <span className="text-sm text-muted-foreground">{new Date(v.created_at).toLocaleDateString("es-CL")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {v.total != null && <span className="text-sm font-semibold text-foreground">${v.total.toLocaleString("es-CL")}</span>}
                        <Badge variant="outline" className={v.status === "Vigente" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
                          {v.status}
                        </Badge>
                      </div>
                    </button>
                    {isExpanded && v.items_snapshot && v.items_snapshot.length > 0 && (
                      <div className="px-5 pb-5">
                        <div className="rounded-lg border bg-muted/20 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] text-sm">
                              <thead>
                                <tr className="border-b bg-muted/30">
                                  {["Servicio", "Descripción", "Cant.", "Moneda", "Valor Unit.", "Total"].map((h, i) => (
                                    <th key={h} className={`px-4 py-2 text-xs font-medium text-muted-foreground uppercase ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {v.items_snapshot.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2 font-medium text-foreground">{item.service}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{item.description}</td>
                                    <td className="px-4 py-2 text-right text-foreground">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right text-foreground">{item.currency ?? "CLP"}</td>
                                    <td className="px-4 py-2 text-right text-foreground">{item.currency === "UF" ? `UF ${item.unit_price.toLocaleString("es-CL")}` : `$${item.unit_price.toLocaleString("es-CL")}`}</td>
                                    <td className="px-4 py-2 text-right font-medium text-foreground">{item.currency === "UF" ? `UF ${(item.quantity * item.unit_price).toLocaleString("es-CL")}` : `$${(item.quantity * item.unit_price).toLocaleString("es-CL")}`}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: DOCUMENTOS ── */}
        <TabsContent value="documentos" className="mt-4">
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Documentos</h2>

            <input ref={approvalInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleApprovalFileSelected} />
            <input ref={facturaInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFacturaFileSelected} />
            <input ref={ocInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleOCFileSelected} />

            {documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay documentos adjuntos.</p>
            ) : (
              <div className="space-y-2">
                {documentos.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline flex items-center gap-1">
                        {d.name}<ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    ) : (
                      <span className="text-foreground">{d.name}</span>
                    )}
                    <Badge variant="outline" className="text-xs">{d.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("es-CL")}</span>
                    {isAdmin && (
                      <button onClick={() => handleDeleteDocumento(d.id)} className="ml-1 text-destructive hover:text-destructive/80 transition-colors" title="Eliminar documento">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" className="gap-2" onClick={() => approvalInputRef.current?.click()} disabled={uploading || documentos.some((d) => d.type === "Aprobación")}>
                <Upload className="h-4 w-4" />{uploading ? "Subiendo..." : "Adjuntar Aprobación"}
              </Button>
              {hasOC === true && (
                <Button variant="outline" className="gap-2" onClick={() => ocInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4" /> Subir Orden de Compra
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={() => facturaInputRef.current?.click()} disabled={uploading}>
                <FileText className="h-4 w-4" />{uploading ? "Subiendo..." : "Subir Factura"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cotización {id}</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. Se eliminarán todos los items, versiones y documentos asociados.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Eliminando..." : "Eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOCModal} onOpenChange={setShowOCModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Esta cotización tiene Orden de Compra (OC)?</DialogTitle>
            <DialogDescription>Indique si el cliente ha proporcionado una Orden de Compra para esta cotización.</DialogDescription>
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

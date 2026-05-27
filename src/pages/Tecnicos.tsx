import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, Upload, FileText, X, ChevronDown, ChevronUp, Banknote, ExternalLink, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ─── Combobox ─────────────────────────────────────────────────────────────────

type ComboboxOption = { value: string; label: string; sublabel?: string };

function ComboboxInput({
  value, onChange, options, placeholder, disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayQuery = open ? query : (selected?.label ?? "");

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sublabel ?? "").toLowerCase().includes(query.toLowerCase()) ||
        o.value.toLowerCase().includes(query.toLowerCase())
      )
    : options.slice(0, 50);

  const handleSelect = useCallback((opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  }, [onChange]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        className="h-8 text-xs"
        placeholder={placeholder}
        disabled={disabled}
        value={displayQuery}
        onFocus={() => { setQuery(""); setOpen(true); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-popover border rounded-md shadow-md">
          {filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground flex flex-col"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.sublabel && <span className="text-muted-foreground">{opt.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Ticket = {
  id: string;
  clientName: string;
  title: string;
  status: string;
  cotizacionId: string | null;
};

type Tecnico = {
  id: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  createdAt: string;
  asignaciones?: { id: string }[];
};

type TecnicoArchivo = {
  id: string;
  tecnicoId: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
};

type TecnicoDetail = Tecnico & { archivos: TecnicoArchivo[] };

type TecnicoDocumento = {
  id: string;
  asignacionId: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
};

type CotizacionResumen = {
  id: string;
  title: string;
  status: string;
  cliente: { name: string };
};

type Asignacion = {
  id: string;
  ticketId: string;
  tecnicoId: string;
  tipoPago: string;
  montoClp: number | null;
  montoUf: number | null;
  ufValue: number | null;
  estado: string;
  notas: string;
  createdAt: string;
  tecnico: Tecnico;
  documentos: TecnicoDocumento[];
  cotizacion: CotizacionResumen | null;
};

type TecnicoForm = {
  name: string; rut: string; email: string; phone: string;
  banco: string; tipoCuenta: string; numeroCuenta: string;
};

type AsignacionForm = {
  ticket_id: string; tecnico_id: string; tipo_pago: string;
  monto_clp: string; monto_uf: string; uf_value: string; notas: string; estado: string;
};

const emptyTecnico: TecnicoForm = { name: "", rut: "", email: "", phone: "", banco: "", tipoCuenta: "", numeroCuenta: "" };
const emptyAsignacion: AsignacionForm = { ticket_id: "", tecnico_id: "", tipo_pago: "CLP", monto_clp: "", monto_uf: "", uf_value: "", notas: "", estado: "Pendiente" };

const TIPO_CUENTA = ["Cuenta Corriente", "Cuenta Vista", "Cuenta de Ahorro", "Cuenta RUT"];
const TIPOS_DOC = ["Comprobante de Transferencia", "Factura", "Boleta", "Otro"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMonto(a: Asignacion) {
  if (a.tipoPago === "CLP" && a.montoClp != null)
    return `$${a.montoClp.toLocaleString("es-CL")} CLP`;
  if (a.tipoPago === "UF" && a.montoUf != null)
    return `${a.montoUf.toLocaleString("es-CL", { maximumFractionDigits: 4 })} UF`;
  if (a.tipoPago === "Mixto") {
    const parts = [];
    if (a.montoClp != null) parts.push(`$${a.montoClp.toLocaleString("es-CL")} CLP`);
    if (a.montoUf != null) parts.push(`${a.montoUf.toLocaleString("es-CL", { maximumFractionDigits: 4 })} UF`);
    return parts.join(" + ");
  }
  return "-";
}

function montoEnCLP(a: Asignacion): string {
  const clp = a.montoClp ?? 0;
  const uf = a.montoUf != null && a.ufValue != null ? a.montoUf * a.ufValue : 0;
  const total = clp + uf;
  if (total === 0) return "-";
  return `$${Math.round(total).toLocaleString("es-CL")} CLP`;
}

function estadoBadge(estado: string) {
  return estado === "Pagado"
    ? "bg-success/10 text-success border-success/20"
    : "bg-warning/10 text-warning border-warning/20";
}

// ─── Componente AsignacionCard ─────────────────────────────────────────────────

function AsignacionCard({
  asignacion, isAdmin, onEdit, onDelete, onUploadDoc, onDeleteDoc, uploading,
}: {
  asignacion: Asignacion;
  isAdmin: boolean;
  onEdit: (a: Asignacion) => void;
  onDelete: (a: Asignacion) => void;
  onUploadDoc: (asignacionId: string, file: File, name: string, type: string) => Promise<void>;
  onDeleteDoc: (asignacionId: string, docId: string) => Promise<void>;
  uploading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", type: TIPOS_DOC[0] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile || !docForm.name) { toast.error("Completa nombre y selecciona un archivo"); return; }
    await onUploadDoc(asignacion.id, selectedFile, docForm.name, docForm.type);
    setDocForm({ name: "", type: TIPOS_DOC[0] });
    setSelectedFile(null);
    setShowUpload(false);
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{asignacion.ticketId}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(asignacion.estado)}`}>
              {asignacion.estado}
            </span>
            <Badge variant="outline" className="text-xs">{asignacion.tipoPago}</Badge>
          </div>
          {asignacion.cotizacion ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              {asignacion.cotizacion.cliente.name}
              {asignacion.cotizacion.title && (
                <span className="text-xs"> · {asignacion.cotizacion.title}</span>
              )}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{asignacion.tecnico.name}</p>
          <p className={`text-sm font-semibold mt-1 ${asignacion.estado === "Pagado" ? "text-success" : "text-foreground"}`}>
            {asignacion.estado === "Pagado" ? "Pagado: " : "Por pagar: "}{montoEnCLP(asignacion)}
          </p>
          {asignacion.ufValue && asignacion.tipoPago !== "CLP" && (
            <p className="text-xs text-muted-foreground">Valor UF: ${asignacion.ufValue.toLocaleString("es-CL")}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(asignacion)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(asignacion)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {asignacion.notas && <p className="text-xs text-muted-foreground border-t pt-2">{asignacion.notas}</p>}

      {expanded && (
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Documentos ({asignacion.documentos.length})</span>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowUpload(!showUpload)}>
              <Upload className="h-3 w-3" /> Subir
            </Button>
          </div>

          {showUpload && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input className="h-8 text-xs" placeholder="Ej: Comprobante enero" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={docForm.type} onValueChange={(v) => setDocForm({ ...docForm, type: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOC.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileRef.current?.click()}>
                  {selectedFile ? selectedFile.name : "Seleccionar archivo"}
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleUpload} disabled={uploading === asignacion.id}>
                  {uploading === asignacion.id ? "Subiendo..." : "Subir"}
                </Button>
              </div>
            </div>
          )}

          {asignacion.documentos.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin documentos adjuntos</p>
          ) : (
            <div className="space-y-1.5">
              {asignacion.documentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline truncate block">{doc.name}</a>
                      <p className="text-[10px] text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onDeleteDoc(asignacion.id, doc.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function Tecnicos() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTec, setLoadingTec] = useState(true);
  const [loadingAsig, setLoadingAsig] = useState(true);
  const [search, setSearch] = useState("");
  const [searchAsig, setSearchAsig] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  // Sheet detalle técnico
  const [sheetTec, setSheetTec] = useState<TecnicoDetail | null>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [uploadingArchivo, setUploadingArchivo] = useState(false);
  const [archivoForm, setArchivoForm] = useState({ name: "", type: TIPOS_DOC[0] });
  const [selectedArchivo, setSelectedArchivo] = useState<File | null>(null);
  const archivoFileRef = useRef<HTMLInputElement>(null);

  // Modal técnico
  const [showTecModal, setShowTecModal] = useState(false);
  const [editingTec, setEditingTec] = useState<string | null>(null);
  const [tecForm, setTecForm] = useState<TecnicoForm>(emptyTecnico);
  const [savingTec, setSavingTec] = useState(false);
  const [deleteTec, setDeleteTec] = useState<Tecnico | null>(null);
  const [deletingTec, setDeletingTec] = useState(false);

  // Modal asignación
  const [showAsigModal, setShowAsigModal] = useState(false);
  const [editingAsig, setEditingAsig] = useState<string | null>(null);
  const [asigForm, setAsigForm] = useState<AsignacionForm>(emptyAsignacion);
  const [savingAsig, setSavingAsig] = useState(false);
  const [deleteAsig, setDeleteAsig] = useState<Asignacion | null>(null);
  const [deletingAsig, setDeletingAsig] = useState(false);
  const [fetchingUf, setFetchingUf] = useState(false);

  const fetchUfActual = async () => {
    setFetchingUf(true);
    try {
      const res = await fetch("https://mindicador.cl/api/uf");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const valor: number = data?.serie?.[0]?.valor;
      if (!valor) throw new Error();
      setAsigForm((prev) => ({ ...prev, uf_value: String(valor) }));
      toast.success(`UF del día: $${valor.toLocaleString("es-CL")}`);
    } catch {
      toast.error("No se pudo obtener el valor de la UF");
    } finally {
      setFetchingUf(false);
    }
  };

  async function fetchTecnicos() {
    try {
      const data = await api.get<Tecnico[]>("/tecnicos");
      setTecnicos(data ?? []);
    } catch { toast.error("Error al cargar técnicos"); }
    setLoadingTec(false);
  }

  async function fetchAsignaciones() {
    try {
      const data = await api.get<Asignacion[]>("/tecnicos/asignaciones");
      setAsignaciones(data ?? []);
    } catch { toast.error("Error al cargar asignaciones"); }
    setLoadingAsig(false);
  }

  useEffect(() => {
    fetchTecnicos();
    fetchAsignaciones();
    api.get<Ticket[]>("/tickets").then((data) => setTickets(data ?? [])).catch(() => {});
  }, []);

  async function openSheet(t: Tecnico) {
    setLoadingSheet(true);
    setSheetTec({ ...t, archivos: [] });
    try {
      const data = await api.get<TecnicoDetail>(`/tecnicos/${t.id}`);
      if (data) setSheetTec(data);
    } catch { toast.error("Error al cargar archivos del técnico"); }
    setLoadingSheet(false);
  }

  async function handleUploadArchivo() {
    if (!sheetTec || !selectedArchivo || !archivoForm.name) {
      toast.error("Completa nombre y selecciona un archivo");
      return;
    }
    setUploadingArchivo(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedArchivo);
      formData.append("name", archivoForm.name);
      formData.append("type", archivoForm.type);
      const nuevo = await api.upload<TecnicoArchivo>(`/tecnicos/${sheetTec.id}/archivos`, formData);
      if (nuevo) setSheetTec((prev) => prev ? { ...prev, archivos: [nuevo, ...prev.archivos] } : prev);
      setArchivoForm({ name: "", type: TIPOS_DOC[0] });
      setSelectedArchivo(null);
      toast.success("Archivo subido");
    } catch { toast.error("Error al subir archivo"); }
    setUploadingArchivo(false);
  }

  async function handleDeleteArchivo(archivoId: string) {
    if (!sheetTec) return;
    try {
      await api.delete(`/tecnicos/${sheetTec.id}/archivos/${archivoId}`);
      setSheetTec((prev) => prev ? { ...prev, archivos: prev.archivos.filter((a) => a.id !== archivoId) } : prev);
      toast.success("Archivo eliminado");
    } catch { toast.error("Error al eliminar archivo"); }
  }

  // ── Técnicos CRUD ──────────────────────────────────────────────────────────

  const openCreateTec = () => { setEditingTec(null); setTecForm(emptyTecnico); setShowTecModal(true); };
  const openEditTec = (t: Tecnico) => {
    setEditingTec(t.id);
    setTecForm({ name: t.name, rut: t.rut, email: t.email, phone: t.phone, banco: t.banco, tipoCuenta: t.tipoCuenta, numeroCuenta: t.numeroCuenta });
    setShowTecModal(true);
  };

  const handleSaveTec = async () => {
    if (!tecForm.name || !tecForm.rut) { toast.error("Nombre y RUT son obligatorios"); return; }
    setSavingTec(true);
    try {
      if (editingTec) {
        await api.put(`/tecnicos/${editingTec}`, tecForm);
        toast.success("Técnico actualizado");
      } else {
        await api.post("/tecnicos", tecForm);
        toast.success("Técnico creado");
      }
      setShowTecModal(false);
      await fetchTecnicos();
    } catch (err: any) {
      toast.error(err.message?.includes("RUT") ? "El RUT ya existe" : "Error al guardar técnico");
    }
    setSavingTec(false);
  };

  const handleDeleteTec = async () => {
    if (!deleteTec) return;
    setDeletingTec(true);
    try {
      await api.delete(`/tecnicos/${deleteTec.id}`);
      toast.success("Técnico eliminado");
      setDeleteTec(null);
      await fetchTecnicos();
    } catch { toast.error("Error al eliminar técnico"); }
    setDeletingTec(false);
  };

  // ── Asignaciones CRUD ──────────────────────────────────────────────────────

  const openCreateAsig = () => { setEditingAsig(null); setAsigForm(emptyAsignacion); setShowAsigModal(true); };
  const openEditAsig = (a: Asignacion) => {
    setEditingAsig(a.id);
    setAsigForm({
      ticket_id: a.ticketId,
      tecnico_id: a.tecnicoId,
      tipo_pago: a.tipoPago,
      monto_clp: a.montoClp?.toString() ?? "",
      monto_uf: a.montoUf?.toString() ?? "",
      uf_value: a.ufValue?.toString() ?? "",
      notas: a.notas,
      estado: a.estado,
    });
    setShowAsigModal(true);
  };

  const handleSaveAsig = async () => {
    if (!asigForm.ticket_id || !asigForm.tecnico_id) { toast.error("Ticket ID y técnico son obligatorios"); return; }
    setSavingAsig(true);
    const payload = {
      ticket_id: asigForm.ticket_id,
      tecnico_id: asigForm.tecnico_id,
      tipo_pago: asigForm.tipo_pago,
      monto_clp: asigForm.monto_clp ? parseFloat(asigForm.monto_clp) : null,
      monto_uf: asigForm.monto_uf ? parseFloat(asigForm.monto_uf) : null,
      uf_value: asigForm.uf_value ? parseFloat(asigForm.uf_value) : null,
      notas: asigForm.notas,
      ...(editingAsig ? { estado: asigForm.estado } : {}),
    };
    try {
      if (editingAsig) {
        await api.put(`/tecnicos/asignaciones/${editingAsig}`, payload);
        toast.success("Asignación actualizada");
      } else {
        await api.post("/tecnicos/asignaciones", payload);
        toast.success("Asignación creada");
      }
      setShowAsigModal(false);
      await fetchAsignaciones();
    } catch { toast.error("Error al guardar asignación"); }
    setSavingAsig(false);
  };

  const handleDeleteAsig = async () => {
    if (!deleteAsig) return;
    setDeletingAsig(true);
    try {
      await api.delete(`/tecnicos/asignaciones/${deleteAsig.id}`);
      toast.success("Asignación eliminada");
      setDeleteAsig(null);
      await fetchAsignaciones();
    } catch { toast.error("Error al eliminar asignación"); }
    setDeletingAsig(false);
  };

  // ── Documentos ──────────────────────────────────────────────────────────────

  const handleUploadDoc = async (asignacionId: string, file: File, name: string, type: string) => {
    setUploading(asignacionId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("type", type);
      await api.upload(`/tecnicos/asignaciones/${asignacionId}/documentos`, formData);
      const asig = asignaciones.find((a) => a.id === asignacionId);
      if (asig && asig.estado !== "Pagado") {
        await api.put(`/tecnicos/asignaciones/${asignacionId}`, {
          tipo_pago: asig.tipoPago,
          monto_clp: asig.montoClp,
          monto_uf: asig.montoUf,
          uf_value: asig.ufValue,
          estado: "Pagado",
          notas: asig.notas,
        });
        toast.success("Documento subido · asignación marcada como Pagado");
      } else {
        toast.success("Documento subido");
      }
      await fetchAsignaciones();
    } catch { toast.error("Error al subir documento"); }
    setUploading(null);
  };

  const handleDeleteDoc = async (asignacionId: string, docId: string) => {
    try {
      await api.delete(`/tecnicos/asignaciones/${asignacionId}/documentos/${docId}`);
      toast.success("Documento eliminado");
      await fetchAsignaciones();
    } catch { toast.error("Error al eliminar documento"); }
  };

  // ── Filtros ─────────────────────────────────────────────────────────────────

  const filteredTec = tecnicos.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.rut.includes(search)
  );

  const filteredAsig = asignaciones.filter((a) => {
    const q = searchAsig.toLowerCase();
    return (
      a.ticketId.toLowerCase().includes(q) ||
      a.tecnico.name.toLowerCase().includes(q) ||
      (a.cotizacion?.title ?? "").toLowerCase().includes(q) ||
      (a.cotizacion?.cliente.name ?? "").toLowerCase().includes(q)
    );
  });


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Técnicos</h1>
          <p className="page-subheader">Gestión de técnicos y pagos</p>
        </div>
      </div>

      {/* ── Sección Técnicos ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar técnico..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button className="gap-2" onClick={openCreateTec}>
            <Plus className="h-4 w-4" /> Nuevo Técnico
          </Button>
        </div>

        {loadingTec ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
        ) : filteredTec.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No se encontraron técnicos.</div>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredTec.map((t) => (
                <div key={t.id} className="bg-card rounded-lg border shadow-sm p-3 space-y-1 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openSheet(t)}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">{t.name}</h3>
                      <p className="text-xs text-muted-foreground">{t.rut}</p>
                    </div>
                    <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditTec(t)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTec(t)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {t.email && <p className="text-xs text-muted-foreground truncate">{t.email}</p>}
                  {t.phone && <p className="text-xs text-muted-foreground">{t.phone}</p>}
                  {t.banco && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Banknote className="h-3 w-3 shrink-0" />
                      <span className="truncate">{t.banco} · {t.numeroCuenta}</span>
                    </div>
                  )}
                  <Badge variant="secondary" className="text-[10px] h-4">{t.asignaciones?.length ?? 0} asig.</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sección Asignaciones ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-foreground">Asignaciones ({asignaciones.length})</h2>
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por ticket o técnico..." value={searchAsig} onChange={(e) => setSearchAsig(e.target.value)} className="pl-9" />
            </div>
            <Button className="gap-2" onClick={openCreateAsig}>
              <Plus className="h-4 w-4" /> Nueva Asignación
            </Button>
          </div>
        </div>

        {loadingAsig ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
        ) : filteredAsig.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No se encontraron asignaciones.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAsig.map((a) => (
              <AsignacionCard
                key={a.id}
                asignacion={a}
                isAdmin={isAdmin}
                onEdit={openEditAsig}
                onDelete={setDeleteAsig}
                onUploadDoc={handleUploadDoc}
                onDeleteDoc={handleDeleteDoc}
                uploading={uploading}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Técnico ── */}
      <Dialog open={showTecModal} onOpenChange={setShowTecModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTec ? "Editar Técnico" : "Nuevo Técnico"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Nombre *", key: "name", placeholder: "Nombre completo" },
                { label: "RUT *", key: "rut", placeholder: "XX.XXX.XXX-X" },
                { label: "Correo", key: "email", placeholder: "correo@ejemplo.cl", type: "email" },
                { label: "Teléfono", key: "phone", placeholder: "+56 9 XXXX XXXX" },
                { label: "Banco", key: "banco", placeholder: "Banco Estado, Santander..." },
                { label: "N° Cuenta", key: "numeroCuenta", placeholder: "Número de cuenta" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input type={type ?? "text"} placeholder={placeholder} className="h-8"
                    value={tecForm[key as keyof TecnicoForm]}
                    onChange={(e) => setTecForm({ ...tecForm, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Cuenta</Label>
              <Select value={tecForm.tipoCuenta} onValueChange={(v) => setTecForm({ ...tecForm, tipoCuenta: v })}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {TIPO_CUENTA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTecModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveTec} disabled={savingTec}>
              {savingTec ? "Guardando..." : editingTec ? "Guardar Cambios" : "Crear Técnico"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Asignación ── */}
      <Dialog open={showAsigModal} onOpenChange={setShowAsigModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAsig ? "Editar Asignación" : "Nueva Asignación"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ID Ticket *</Label>
                <ComboboxInput
                  value={asigForm.ticket_id}
                  onChange={(v) => setAsigForm({ ...asigForm, ticket_id: v })}
                  disabled={!!editingAsig}
                  placeholder="Buscar ticket..."
                  options={tickets.map((t) => ({
                    value: t.id,
                    label: t.id,
                    sublabel: [t.clientName, t.title, t.status].filter(Boolean).join(" · "),
                  }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Técnico *</Label>
                <ComboboxInput
                  value={asigForm.tecnico_id}
                  onChange={(v) => setAsigForm({ ...asigForm, tecnico_id: v })}
                  disabled={!!editingAsig}
                  placeholder="Buscar técnico..."
                  options={tecnicos.map((t) => ({
                    value: t.id,
                    label: t.name,
                    sublabel: t.rut,
                  }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Pago</Label>
              <Select value={asigForm.tipo_pago} onValueChange={(v) => setAsigForm({ ...asigForm, tipo_pago: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP</SelectItem>
                  <SelectItem value="UF">UF</SelectItem>
                  <SelectItem value="Mixto">Mixto (CLP + UF)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(asigForm.tipo_pago === "CLP" || asigForm.tipo_pago === "Mixto") && (
                <div className="space-y-1">
                  <Label className="text-xs">Monto CLP</Label>
                  <Input className="h-8" type="number" placeholder="0" value={asigForm.monto_clp}
                    onChange={(e) => setAsigForm({ ...asigForm, monto_clp: e.target.value })}
                  />
                </div>
              )}
              {(asigForm.tipo_pago === "UF" || asigForm.tipo_pago === "Mixto") && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Monto UF</Label>
                    <Input className="h-8" type="number" step="0.0001" placeholder="0.0000" value={asigForm.monto_uf}
                      onChange={(e) => setAsigForm({ ...asigForm, monto_uf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor UF del día</Label>
                    <div className="flex gap-1.5">
                      <Input className="h-8" type="number" placeholder="0" value={asigForm.uf_value}
                        onChange={(e) => setAsigForm({ ...asigForm, uf_value: e.target.value })}
                      />
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={fetchUfActual} disabled={fetchingUf} title="Obtener UF actual">
                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingUf ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {editingAsig && (
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <Select value={asigForm.estado} onValueChange={(v) => setAsigForm({ ...asigForm, estado: v })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Textarea className="resize-none text-sm" rows={2} placeholder="Observaciones del pago..."
                value={asigForm.notas} onChange={(e) => setAsigForm({ ...asigForm, notas: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAsigModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveAsig} disabled={savingAsig}>
              {savingAsig ? "Guardando..." : editingAsig ? "Guardar Cambios" : "Crear Asignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm delete técnico ── */}
      <Dialog open={!!deleteTec} onOpenChange={(o) => { if (!o) setDeleteTec(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar técnico</DialogTitle>
            <DialogDescription>
              ¿Eliminar a <strong>{deleteTec?.name}</strong>? Se eliminarán también todas sus asignaciones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTec(null)} disabled={deletingTec}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTec} disabled={deletingTec}>
              {deletingTec ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sheet detalle técnico ── */}
      <Sheet open={!!sheetTec} onOpenChange={(o) => { if (!o) { setSheetTec(null); setSelectedArchivo(null); setArchivoForm({ name: "", type: TIPOS_DOC[0] }); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {sheetTec && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle>{sheetTec.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{sheetTec.rut}</p>
              </SheetHeader>

              {/* Info técnico */}
              <div className="space-y-1.5 pb-4 border-b text-sm">
                {sheetTec.email && <p><span className="text-muted-foreground">Email: </span>{sheetTec.email}</p>}
                {sheetTec.phone && <p><span className="text-muted-foreground">Teléfono: </span>{sheetTec.phone}</p>}
                {sheetTec.banco && (
                  <p><span className="text-muted-foreground">Banco: </span>{sheetTec.banco} · {sheetTec.tipoCuenta} · {sheetTec.numeroCuenta}</p>
                )}
              </div>

              {/* Documentos */}
              <div className="pt-4 space-y-4">
                <h3 className="font-medium text-sm">Documentos adjuntos</h3>

                {/* Upload */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input className="h-8 text-xs" placeholder="Ej: Contrato 2025"
                        value={archivoForm.name}
                        onChange={(e) => setArchivoForm({ ...archivoForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={archivoForm.type} onValueChange={(v) => setArchivoForm({ ...archivoForm, type: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_DOC.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={archivoFileRef} type="file" className="hidden" onChange={(e) => setSelectedArchivo(e.target.files?.[0] ?? null)} />
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 truncate" onClick={() => archivoFileRef.current?.click()}>
                      {selectedArchivo ? selectedArchivo.name : "Seleccionar archivo"}
                    </Button>
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={handleUploadArchivo} disabled={uploadingArchivo}>
                      <Upload className="h-3 w-3" />
                      {uploadingArchivo ? "Subiendo..." : "Subir"}
                    </Button>
                  </div>
                </div>

                {/* Lista */}
                {loadingSheet ? (
                  <p className="text-xs text-muted-foreground">Cargando...</p>
                ) : sheetTec.archivos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin documentos adjuntos.</p>
                ) : (
                  <div className="space-y-2">
                    {sheetTec.archivos.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-2 p-2.5 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex items-center gap-1 truncate">
                              {a.name} <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            <p className="text-xs text-muted-foreground">{a.type} · {new Date(a.createdAt).toLocaleDateString("es-CL")}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteArchivo(a.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Confirm delete asignación ── */}
      <Dialog open={!!deleteAsig} onOpenChange={(o) => { if (!o) setDeleteAsig(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar asignación</DialogTitle>
            <DialogDescription>
              ¿Eliminar la asignación del técnico <strong>{deleteAsig?.tecnico.name}</strong> en el ticket #{deleteAsig?.ticketId}? Se eliminarán también los documentos adjuntos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAsig(null)} disabled={deletingAsig}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteAsig} disabled={deletingAsig}>
              {deletingAsig ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { type Profile } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Trash2 } from "lucide-react";

export default function Configuracion() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [form, setForm] = useState({ company_name: "Mi Empresa TI SpA", company_rut: "76.000.000-0", tickets_url: "", ticketera_email: "", ticketera_password: "" });

  const [notifications, setNotifications] = useState({
    creacion_cotizacion: true,
    aprobacion_cotizacion: true,
    cierre_ticket: true,
    subida_factura: true,
  });

  const notificationOptions = [
    { key: "creacion_cotizacion", label: "Creación de cotización" },
    { key: "aprobacion_cotizacion", label: "Aprobación de cotización" },
    { key: "cierre_ticket", label: "Cierre de ticket" },
    { key: "subida_factura", label: "Subida de factura" },
  ] as const;
  const [saving, setSaving] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "comercial" as "admin" | "comercial" });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      const data = await api.get<any>("/configuracion");
      if (data) {
        setForm({
          company_name: data.companyName ?? data.company_name ?? "",
          company_rut: data.companyRut ?? data.company_rut ?? "",
          tickets_url: data.ticketsUrl ?? data.tickets_url ?? "",
          ticketera_email: data.ticketeraEmail ?? data.ticketera_email ?? "",
          ticketera_password: data.ticketeraPassword ?? data.ticketera_password ?? "",
        });
      }
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProfiles();
  }, [isAdmin]);

  async function fetchProfiles() {
    setLoadingUsers(true);
    const data = await api.get<Profile[]>("/auth/usuarios");
    setProfiles(data);
    setLoadingUsers(false);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/configuracion", form);
      toast.success("Configuración guardada correctamente");
    } catch {
      toast.error("Error al guardar la configuración");
    }
    setSaving(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email y contraseña son requeridos");
      return;
    }
    setCreatingUser(true);
    try {
      await api.post("/auth/register", newUser);
      toast.success(`Usuario ${newUser.email} creado correctamente`);
      setShowCreateUser(false);
      setNewUser({ email: "", password: "", full_name: "", role: "comercial" });
      fetchProfiles();
    } catch (e: any) {
      toast.error(e.message ?? "Error al crear usuario");
    }
    setCreatingUser(false);
  };

  const handleChangeRole = async (userId: string, role: "admin" | "comercial") => {
    try {
      await api.put(`/auth/usuarios/${userId}`, { role });
      toast.success("Rol actualizado");
      fetchProfiles();
    } catch {
      toast.error("Error al cambiar el rol");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`¿Eliminar al usuario ${email}?`)) return;
    try {
      await api.delete(`/auth/usuarios/${userId}`);
      toast.success("Usuario eliminado");
      fetchProfiles();
    } catch {
      toast.error("Error al eliminar usuario");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Configuración</h1>
        <p className="page-subheader">Ajustes generales del sistema</p>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground">Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre de la empresa</Label>
              <Input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>RUT</Label>
              <Input
                value={form.company_rut}
                onChange={(e) => setForm({ ...form, company_rut: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-semibold text-foreground">Notificaciones</h2>
          <p className="text-sm text-muted-foreground">Selecciona los eventos para los que deseas recibir notificaciones.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notificationOptions.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={key}
                  checked={notifications[key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [key]: !!checked }))
                  }
                />
                <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Integración Ticketera</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Credenciales para conectarse a <span className="font-medium">api-ticketera.siroe.cl</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="usuario@soportesiroe.cl"
                value={form.ticketera_email}
                onChange={(e) => setForm({ ...form, ticketera_email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.ticketera_password}
                onChange={(e) => setForm({ ...form, ticketera_password: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Gestión de Usuarios</h2>
            <Button size="sm" className="gap-2" onClick={() => setShowCreateUser(true)}>
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>

          {loadingUsers ? (
            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell>
                      <Select
                        value={p.role}
                        onValueChange={(val) => handleChangeRole(p.id, val as "admin" | "comercial")}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteUser(p.id, p.email)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input
                placeholder="Juan Pérez"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="usuario@empresa.cl"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select
                value={newUser.role}
                onValueChange={(val) => setNewUser({ ...newUser, role: val as "admin" | "comercial" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

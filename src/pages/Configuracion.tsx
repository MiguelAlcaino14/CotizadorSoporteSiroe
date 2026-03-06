import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { supabase, type Profile } from "@/lib/supabase";
import { UserPlus, Trash2 } from "lucide-react";

export default function Configuracion() {
  const isAdmin = true;

  const [form, setForm] = useState({ company_name: "Mi Empresa TI SpA", company_rut: "76.000.000-0", tickets_url: "" });
  const [saving, setSaving] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "comercial" as "admin" | "comercial" });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from("configuracion").select("*").eq("id", 1).maybeSingle();
      if (data) {
        setForm({
          company_name: data.company_name,
          company_rut: data.company_rut,
          tickets_url: data.tickets_url ?? "",
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
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    if (data) setProfiles(data as Profile[]);
    setLoadingUsers(false);
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("configuracion")
      .upsert({ id: 1, ...form, updated_at: new Date().toISOString() });
    if (error) {
      toast.error("Error al guardar la configuración");
    } else {
      toast.success("Configuración guardada correctamente");
    }
    setSaving(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email y contraseña son requeridos");
      return;
    }
    setCreatingUser(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: { data: { full_name: newUser.full_name } },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setCreatingUser(false);
      return;
    }

    if (signUpData.user) {
      await new Promise((r) => setTimeout(r, 800));
      await supabase
        .from("profiles")
        .update({ role: newUser.role, full_name: newUser.full_name })
        .eq("id", signUpData.user.id);
    }

    toast.success(`Usuario ${newUser.email} creado correctamente`);
    setShowCreateUser(false);
    setNewUser({ email: "", password: "", full_name: "", role: "comercial" });
    fetchProfiles();
    setCreatingUser(false);
  };

  const handleChangeRole = async (userId: string, role: "admin" | "comercial") => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) {
      toast.error("Error al cambiar el rol");
    } else {
      toast.success("Rol actualizado");
      fetchProfiles();
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`¿Eliminar al usuario ${email}?`)) return;
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) {
      toast.error("Error al eliminar usuario");
    } else {
      toast.success("Usuario eliminado");
      fetchProfiles();
    }
  };

  const roleLabel: Record<string, string> = { admin: "Admin", comercial: "Comercial" };
  const roleColors: Record<string, string> = {
    admin: "bg-primary/10 text-primary border-primary/20",
    comercial: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6 max-w-2xl">
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
          <p className="text-sm text-muted-foreground">
            Las notificaciones se envían automáticamente para: creación, modificación, aprobación de cotización,
            creación y cierre de tickets, subida de OC y factura.
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-semibold text-foreground">Integración Ticketera</h2>
          <div className="space-y-1.5">
            <Label>URL del sistema de tickets</Label>
            <Input
              placeholder="https://tickets.miempresa.cl/api"
              value={form.tickets_url}
              onChange={(e) => setForm({ ...form, tickets_url: e.target.value })}
            />
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
                      {false ? (
                        <Badge variant="outline" className={roleColors[p.role]}>
                          {roleLabel[p.role]}
                        </Badge>
                      ) : (
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
                      )}
                    </TableCell>
                    <TableCell>
                      {true && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteUser(p.id, p.email)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
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

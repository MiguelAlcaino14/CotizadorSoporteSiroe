import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Configuracion() {
  const [form, setForm] = useState({ company_name: "Mi Empresa TI SpA", company_rut: "76.000.000-0", tickets_url: "" });
  const [saving, setSaving] = useState(false);

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
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Configuracion() {
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
              <Input defaultValue="Mi Empresa TI SpA" />
            </div>
            <div className="space-y-1.5">
              <Label>RUT</Label>
              <Input defaultValue="76.000.000-0" />
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
            <Input placeholder="https://tickets.miempresa.cl/api" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button>Guardar Cambios</Button>
        </div>
      </div>
    </div>
  );
}

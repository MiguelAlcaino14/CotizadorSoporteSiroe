import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LineItem {
  id: string | number;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: "CLP" | "UF";
  isNew?: boolean;
}

interface Props {
  items: LineItem[];
  ufValue: number;
  onUfValueChange: (v: number) => void;
  onItemsChange: (items: LineItem[]) => void;
}

function itemTotalCLP(item: LineItem, ufValue: number): number {
  const base = item.quantity * item.unitPrice;
  return item.currency === "UF" ? base * ufValue : base;
}

const IVA = 0.19;

export default function CotizacionItemsEditor({ items, ufValue, onUfValueChange, onItemsChange }: Props) {
  const hasUFItems = items.some((i) => i.currency === "UF");

  const netTotal = items.reduce((sum, i) => sum + itemTotalCLP(i, ufValue), 0);
  const ivaAmount = netTotal * IVA;
  const grandTotal = netTotal + ivaAmount;

  const addItem = () => {
    onItemsChange([
      ...items,
      {
        id: `new-${Date.now()}`,
        service: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        currency: "CLP",
        isNew: true,
      },
    ]);
  };

  const removeItem = (itemId: string | number) => {
    if (items.length === 1) return;
    onItemsChange(items.filter((i) => i.id !== itemId));
  };

  const updateItem = (itemId: string | number, field: keyof LineItem, value: string | number) => {
    onItemsChange(items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)));
  };

  const handleCurrencyChange = (itemId: string | number, currency: "CLP" | "UF") => {
    onItemsChange(
      items.map((i) => (i.id === itemId ? { ...i, currency, unitPrice: 0 } : i))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Servicios / Productos</h2>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
          <Plus className="h-4 w-4" /> Agregar ítem
        </Button>
      </div>

      {hasUFItems && (
        <div className="flex items-end gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
          <div className="space-y-1.5 w-48">
            <Label className="text-xs">Valor UF (en CLP)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Ej: 38500"
              value={ufValue || ""}
              onChange={(e) => onUfValueChange(parseFloat(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground pb-1">
            Necesario para calcular el total de ítems en UF
          </p>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Servicio / Producto
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Descripción
              </th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-20">
                Cant.
              </th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">
                Moneda
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-36">
                Valor Unitario
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">
                Total
              </th>
              <th className="w-10 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => {
              const rowTotal = itemTotalCLP(item, ufValue);
              return (
                <tr key={item.id} className="bg-card hover:bg-muted/10 transition-colors">
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Nombre del servicio..."
                      value={item.service}
                      onChange={(e) => updateItem(item.id, "service", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Descripción opcional..."
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      className="h-8 text-sm text-center w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={item.currency}
                      onValueChange={(v) => handleCurrencyChange(item.id, v as "CLP" | "UF")}
                    >
                      <SelectTrigger className="h-8 text-sm w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP ($)</SelectItem>
                        <SelectItem value="UF">UF</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-muted-foreground text-sm select-none pointer-events-none">
                        {item.currency === "CLP" ? "$" : "UF"}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={item.currency === "UF" ? "0.0001" : "1"}
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        placeholder={item.currency === "UF" ? "0.00" : "0"}
                        className="h-8 text-sm text-right pl-9"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">
                    {item.currency === "UF" && ufValue > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        ${Math.round(rowTotal).toLocaleString("es-CL")}
                      </span>
                    ) : item.currency === "CLP" ? (
                      <span>${Math.round(rowTotal).toLocaleString("es-CL")}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="border-t pt-4 space-y-1.5">
        <div className="flex justify-end gap-10 text-sm">
          <span className="text-muted-foreground">Neto</span>
          <span className="font-medium text-foreground w-36 text-right">
            ${Math.round(netTotal).toLocaleString("es-CL")}
          </span>
        </div>
        <div className="flex justify-end gap-10 text-sm">
          <span className="text-muted-foreground">IVA (19%)</span>
          <span className="font-medium text-foreground w-36 text-right">
            ${Math.round(ivaAmount).toLocaleString("es-CL")}
          </span>
        </div>
        <div className="flex justify-end gap-10 border-t pt-2">
          <span className="text-sm font-semibold text-foreground">Total c/IVA</span>
          <span className="text-xl font-bold text-foreground w-36 text-right">
            ${Math.round(grandTotal).toLocaleString("es-CL")}
          </span>
        </div>
        {hasUFItems && ufValue > 0 && (
          <p className="text-right text-xs text-muted-foreground">
            UF utilizada: ${ufValue.toLocaleString("es-CL")} CLP
          </p>
        )}
      </div>
    </div>
  );
}

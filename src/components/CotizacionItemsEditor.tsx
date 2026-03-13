import React from "react";
import { Plus, Trash2, Save, CalendarIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { supabase, type Producto } from "@/lib/supabase";

const PRODUCT_CATEGORIES = ["Servicio", "Arriendo de Equipos", "Producto", "Licencia / Software"] as const;

export interface LineItem {
  id: string | number;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: "CLP" | "UF";
  category: string;
  rentalPeriod: string;
  rentalFrom?: Date | null;
  rentalTo?: Date | null;
  isNew?: boolean;
}

interface Props {
  items: LineItem[];
  ufValue: number;
  onUfValueChange: (v: number) => void;
  onItemsChange: (items: LineItem[]) => void;
  onSaveUfValue?: (v: number) => Promise<void>;
}

function itemTotalCLP(item: LineItem, ufValue: number): number {
  const base = item.quantity * item.unitPrice;
  return item.currency === "UF" ? base * ufValue : base;
}

const IVA = 0.19;

function fmtShortDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function calcRentalPeriod(from: Date, to: Date): string {
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  if (days >= 30 && days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? "mes" : "meses"}`;
  }
  if (days >= 7 && days % 7 === 0) {
    const weeks = days / 7;
    return `${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }
  return `${days} ${days === 1 ? "día" : "días"}`;
}

export default function CotizacionItemsEditor({ items, ufValue, onUfValueChange, onItemsChange, onSaveUfValue }: Props) {
  const [savingUf, setSavingUf] = React.useState(false);
  const [fetchingUf, setFetchingUf] = React.useState(false);
  const [productos, setProductos] = React.useState<Producto[]>([]);

  const fetchUfActual = async () => {
    setFetchingUf(true);
    try {
      const res = await fetch("https://mindicador.cl/api/uf");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const valor: number = data?.serie?.[0]?.valor;
      if (!valor) throw new Error();
      onUfValueChange(valor);
      toast.success(`UF del día: $${valor.toLocaleString("es-CL")}`);
    } catch {
      toast.error("No se pudo obtener el valor de la UF");
    } finally {
      setFetchingUf(false);
    }
  };
  const [suggestions, setSuggestions] = React.useState<{ itemId: string | number; list: Producto[] } | null>(null);
  const [openRentalPickerId, setOpenRentalPickerId] = React.useState<string | number | null>(null);
  const hasUFItems = items.some((i) => i.currency === "UF");

  React.useEffect(() => {
    supabase.from("productos").select("*").order("name").then(({ data }) => {
      if (data) setProductos(data as Producto[]);
    });
  }, []);

  const handleServiceChange = (itemId: string | number, value: string) => {
    updateItem(itemId, "service", value);
    if (value.length >= 1) {
      const matches = productos.filter((p) => p.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(matches.length > 0 ? { itemId, list: matches } : null);
    } else {
      setSuggestions(null);
    }
  };

  const selectProducto = (itemId: string | number, producto: Producto) => {
    onItemsChange(items.map((i) =>
      i.id === itemId
        ? { ...i, service: producto.name, description: producto.description, unitPrice: producto.unit_price, currency: producto.currency, category: producto.category || "Servicio", rentalPeriod: "", rentalFrom: null, rentalTo: null }
        : i
    ));
    setSuggestions(null);
  };

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
        category: "Servicio",
        rentalPeriod: "",
        rentalFrom: null,
        rentalTo: null,
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
        <div className="flex items-end gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20 flex-wrap">
          <div className="space-y-1.5 w-48">
            <Label className="text-xs">Valor UF (en CLP)</Label>
            <div className="flex gap-1.5">
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Ej: 38500"
                value={ufValue || ""}
                onChange={(e) => onUfValueChange(parseFloat(e.target.value) || 0)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={fetchingUf}
                onClick={fetchUfActual}
                title="Obtener UF del día"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${fetchingUf ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          {onSaveUfValue && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 h-9"
              disabled={savingUf || ufValue <= 0}
              onClick={async () => {
                setSavingUf(true);
                await onSaveUfValue(ufValue);
                setSavingUf(false);
              }}
            >
              <Save className="h-3.5 w-3.5" />
              {savingUf ? "Guardando..." : "Guardar precio UF"}
            </Button>
          )}
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
              const isRental = item.category === "Arriendo de Equipos";
              const rowTotal = itemTotalCLP(item, ufValue);
              return (
                <React.Fragment key={item.id}>
                  <tr className="bg-card hover:bg-muted/10 transition-colors">
                    {/* Servicio */}
                    <td className="px-3 py-2 align-top">
                      <div className="space-y-1">
                        <div className="relative">
                          <Input
                            placeholder="Nombre del servicio..."
                            value={item.service}
                            onChange={(e) => handleServiceChange(item.id, e.target.value)}
                            onBlur={() => setTimeout(() => setSuggestions(null), 150)}
                            className="h-8 text-sm"
                          />
                          {suggestions?.itemId === item.id && suggestions.list.length > 0 && (
                            <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-popover border rounded-md shadow-lg overflow-hidden">
                              {suggestions.list.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b last:border-b-0"
                                  onMouseDown={() => selectProducto(item.id, p)}
                                >
                                  <div className="font-medium text-foreground">{p.name}</div>
                                  {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {p.currency === "UF" ? `UF ${p.unit_price}` : `$${p.unit_price.toLocaleString("es-CL")}`} · {p.currency}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Select
                          value={item.category || "Servicio"}
                          onValueChange={(v) => updateItem(item.id, "category", v)}
                        >
                          <SelectTrigger className="h-6 text-xs py-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>

                    {/* Descripción */}
                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="Descripción opcional..."
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>

                    {/* Cantidad / Días */}
                    <td className="px-3 py-2 align-top">
                      {isRental ? (
                        <div className="h-8 flex flex-col items-center justify-center border rounded-md bg-muted/30">
                          <span className="text-sm font-semibold text-foreground leading-none">{item.quantity}</span>
                          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">días</span>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                          className="h-8 text-sm text-center w-20"
                        />
                      )}
                    </td>

                    {/* Moneda */}
                    <td className="px-3 py-2 align-top">
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

                    {/* Valor unitario */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex h-8 items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <span className="pl-2.5 text-muted-foreground text-sm select-none shrink-0">
                          {item.currency === "CLP" ? "$" : "UF"}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={item.currency === "UF" ? "0.0001" : "1"}
                          value={item.unitPrice || ""}
                          onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          placeholder={item.currency === "UF" ? "0.00" : "0"}
                          className="h-full w-full bg-transparent px-2 text-sm text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        {isRental && (
                          <span className="pr-2.5 text-[11px] text-muted-foreground select-none shrink-0 border-l pl-2 ml-0.5">
                            /día
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-3 py-2 align-top text-right font-medium text-foreground">
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

                    {/* Eliminar */}
                    <td className="px-2 py-2 align-top">
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

                  {/* Fila de fechas de arriendo */}
                  {isRental && (
                    <tr className="bg-violet-50/60 dark:bg-violet-950/20">
                      <td colSpan={7} className="px-3 py-2">
                        <Popover
                          open={openRentalPickerId === item.id}
                          onOpenChange={(open) => setOpenRentalPickerId(open ? item.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-9 justify-start gap-2.5 font-normal border-dashed text-sm"
                            >
                              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              {item.rentalFrom && item.rentalTo ? (
                                <span className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {fmtShortDate(item.rentalFrom)} — {fmtShortDate(item.rentalTo)}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    ({item.quantity} {item.quantity === 1 ? "día" : "días"} · {item.rentalPeriod})
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Seleccionar fechas de arriendo...</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={{
                                from: item.rentalFrom ?? undefined,
                                to: item.rentalTo ?? undefined,
                              }}
                              onSelect={(range: DateRange | undefined) => {
                                const from = range?.from ?? null;
                                const to = range?.to ?? null;
                                const days = from && to
                                  ? Math.round((to.getTime() - from.getTime()) / 86400000) + 1
                                  : item.quantity;
                                const period = from && to ? calcRentalPeriod(from, to) : "";
                                if (from && to) setOpenRentalPickerId(null);
                                onItemsChange(
                                  items.map((i) =>
                                    i.id === item.id
                                      ? { ...i, rentalFrom: from, rentalTo: to, rentalPeriod: period, quantity: from && to ? days : i.quantity }
                                      : i
                                  )
                                );
                              }}
                              numberOfMonths={2}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
            Valor UF utilizado: ${ufValue.toLocaleString("es-CL")} CLP
          </p>
        )}
        {hasUFItems && ufValue <= 0 && (
          <p className="text-right text-xs text-warning">
            Ingresa el valor UF para calcular el total correctamente
          </p>
        )}
      </div>
    </div>
  );
}

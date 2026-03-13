import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Outlet, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const WARN_DAYS = 3;

type ExpiringCot = {
  id: string;
  clientName: string;
  daysLeft: number;
};

export function AppLayout() {
  const navigate = useNavigate();
  const [expiring, setExpiring] = useState<ExpiringCot[]>([]);

  useEffect(() => {
    async function fetchExpiring() {
      const data = await api.get<any[]>("/cotizaciones").catch(() => []);
      const now = new Date();
      const result: ExpiringCot[] = [];

      for (const cot of data) {
        const validityDays = cot.validityDays ?? cot.validity_days ?? 30;
        const createdAt = new Date(cot.createdAt ?? cot.created_at);
        const validUntil = new Date(createdAt);
        validUntil.setDate(validUntil.getDate() + validityDays);
        const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= WARN_DAYS) {
          result.push({
            id: cot.id,
            clientName: cot.clientes?.name ?? cot.cliente?.name ?? "-",
            daysLeft,
          });
        }
      }

      setExpiring(result);
    }

    fetchExpiring();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-3 sm:px-4">
            <SidebarTrigger className="ml-1" />
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {expiring.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {expiring.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-4 border-b">
                    <p className="font-semibold text-sm text-foreground">Notificaciones</p>
                  </div>
                  {expiring.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Sin cotizaciones próximas a vencer
                    </div>
                  ) : (
                    <div className="divide-y">
                      {expiring.map((cot) => (
                        <button
                          key={cot.id}
                          className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors"
                          onClick={() => navigate(`/cotizaciones/${cot.id}`)}
                        >
                          <p className="text-sm font-medium text-foreground">{cot.id}</p>
                          <p className="text-xs text-muted-foreground">{cot.clientName}</p>
                          <p className="text-xs text-warning font-medium mt-0.5">
                            Vence en {cot.daysLeft} día{cot.daysLeft !== 1 ? "s" : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Cotizaciones from "./pages/Cotizaciones";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import DetalleCotizacion from "./pages/DetalleCotizacion";
import Tickets from "./pages/Tickets";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
            <Route path="/cotizaciones/:id" element={<DetalleCotizacion />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

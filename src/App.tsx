import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRoute } from "@/components/RoleRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Cotizaciones from "./pages/Cotizaciones";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import DetalleCotizacion from "./pages/DetalleCotizacion";
import EditarCotizacion from "./pages/EditarCotizacion";
import Configuracion from "./pages/Configuracion";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";
import Tickets from "./pages/Tickets";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/cotizaciones/:id" element={<DetalleCotizacion />} />
            <Route path="/cotizaciones/:id/editar" element={<EditarCotizacion />} />
            <Route element={<RoleRoute allowedRoles={["admin"]} redirectTo="/cotizaciones" />}>
              <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

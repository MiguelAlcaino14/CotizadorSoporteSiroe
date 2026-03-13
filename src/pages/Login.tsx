import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "recovery">("login");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("No se pudo enviar el correo. Verifica el email ingresado.");
    } else {
      toast.success("Revisa tu correo para restablecer tu contraseña.");
      setMode("login");
      setRecoveryEmail("");
    }
    setSendingReset(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
            <img src="/Logo_Siroe_opc_2.png" alt="Siroe" className="w-56 h-auto" />
            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground">
                {mode === "login" ? "Iniciar sesión" : "Recuperar cuenta"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {mode === "login"
                  ? "Ingresa tus credenciales para continuar"
                  : "Te enviaremos un enlace para restablecer tu contraseña"}
              </p>
            </div>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => { setMode("recovery"); setRecoveryEmail(email); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-4 px-6 pb-6">
              <div className="space-y-1.5">
                <Label htmlFor="recovery-email">Email de tu cuenta</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={sendingReset}>
                {sendingReset ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/supabase";

type AuthUser = { id: string; email: string };

type AuthContextType = {
  session: { access_token: string } | null;
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const stored = localStorage.getItem("auth_user");
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ id: parsed.id, email: parsed.email });
        setProfile({ id: parsed.id, email: parsed.email, role: parsed.role, full_name: parsed.full_name, created_at: parsed.created_at ?? "" });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const data = await api.post<{ access_token: string; user: Profile & { id: string; email: string } }>(
        "/auth/login",
        { email, password }
      );
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      setUser({ id: data.user.id, email: data.user.email });
      setProfile({ id: data.user.id, email: data.user.email, role: data.user.role, full_name: data.user.full_name, created_at: "" });
      return { error: null };
    } catch (e: any) {
      return { error: e.message ?? "Error al iniciar sesión" };
    }
  }

  async function signOut() {
    try { await api.post("/auth/logout", {}); } catch { /* ignorar */ }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setProfile(null);
  }

  const session = user ? { access_token: localStorage.getItem("auth_token") ?? "" } : null;

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RoleRouteProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleRoute({ allowedRoles, redirectTo = "/" }: RoleRouteProps) {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
